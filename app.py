import os
import re
import time
import hashlib
import requests
import xml.etree.ElementTree as ET
from flask import Flask, render_template, jsonify, request
from html.parser import HTMLParser

app = Flask(__name__)

# XML/Atom namespace
ATOM_NS = {'atom': 'http://www.w3.org/2005/Atom'}
FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

class ReleaseNotesHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.updates = []
        self.current_type = None
        self.current_html = []
        self.current_text = []
        self.collecting = False
        
    def handle_starttag(self, tag, attrs):
        if tag == 'h3':
            self.save_current_update()
            self.current_type = ''
            self.collecting = 'type'
        else:
            if self.current_type is not None:
                attr_str = "".join([f' {k}="{v}"' for k, v in attrs])
                # Make external links open in a new tab
                if tag == 'a':
                    # Check if target is already specified
                    if 'target' not in attr_str:
                        attr_str += ' target="_blank" rel="noopener noreferrer"'
                self.current_html.append(f"<{tag}{attr_str}>")
                
    def handle_endtag(self, tag):
        if tag == 'h3':
            self.collecting = 'content'
        else:
            if self.current_type is not None:
                self.current_html.append(f"</{tag}>")
                
    def handle_data(self, data):
        if self.collecting == 'type':
            self.current_type += data
        elif self.collecting == 'content' and self.current_type is not None:
            self.current_html.append(data)
            self.current_text.append(data)
            
    def save_current_update(self):
        if self.current_type is not None:
            raw_type = self.current_type.strip()
            raw_html = "".join(self.current_html).strip()
            raw_text = re.sub(r'\s+', ' ', "".join(self.current_text)).strip()
            if raw_type or raw_html:
                self.updates.append({
                    'type': raw_type or 'General',
                    'html': raw_html,
                    'text': raw_text
                })
            self.current_type = None
            self.current_html = []
            self.current_text = []
            self.collecting = False
            
    def parse(self, html_content):
        self.updates = []
        self.current_type = None
        self.current_html = []
        self.current_text = []
        self.collecting = False
        self.feed(html_content)
        self.save_current_update()
        return self.updates

# Simple in-memory cache
cache = {
    'data': None,
    'last_updated': 0
}
CACHE_DURATION = 1800  # 30 minutes cache

def fetch_and_parse_feed():
    try:
        response = requests.get(FEED_URL, timeout=15)
        response.raise_for_status()
        xml_data = response.content
        
        root = ET.fromstring(xml_data)
        entries = root.findall('atom:entry', ATOM_NS)
        
        parsed_updates = []
        html_parser = ReleaseNotesHTMLParser()
        
        for entry in entries:
            entry_title = entry.find('atom:title', ATOM_NS)
            entry_updated = entry.find('atom:updated', ATOM_NS)
            entry_content = entry.find('atom:content', ATOM_NS)
            entry_id = entry.find('atom:id', ATOM_NS)
            
            title = entry_title.text if entry_title is not None else "Unknown Date"
            updated = entry_updated.text if entry_updated is not None else ""
            content = entry_content.text if entry_content is not None else ""
            raw_id = entry_id.text if entry_id is not None else title
            
            # Use md5 of the entry ID to generate a consistent hash
            id_hash = hashlib.md5(raw_id.encode('utf-8')).hexdigest()
            
            entry_updates = html_parser.parse(content)
            for idx, update in enumerate(entry_updates):
                update_id = f"{id_hash}_{idx}"
                parsed_updates.append({
                    'id': update_id,
                    'date': title,
                    'updated': updated,
                    'type': update['type'],
                    'html': update['html'],
                    'text': update['text']
                })
                
        return parsed_updates, None
    except Exception as e:
        return None, str(e)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def get_release_notes():
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    current_time = time.time()
    
    if force_refresh or cache['data'] is None or (current_time - cache['last_updated'] > CACHE_DURATION):
        data, error = fetch_and_parse_feed()
        if error:
            # If fetch fails but we have cached data, return the cached data with a warning
            if cache['data'] is not None:
                return jsonify({
                    'status': 'warning',
                    'message': f"Failed to refresh feed: {error}. Serving cached data.",
                    'updates': cache['data'],
                    'last_updated': cache['last_updated']
                })
            return jsonify({
                'status': 'error',
                'message': f"Failed to fetch release notes: {error}"
            }), 500
        
        cache['data'] = data
        cache['last_updated'] = current_time
        
    return jsonify({
        'status': 'success',
        'updates': cache['data'],
        'last_updated': cache['last_updated']
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
