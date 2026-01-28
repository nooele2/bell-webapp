from flask import Flask, request, jsonify, session, send_file
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import os
import json
from datetime import datetime

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-change-in-production')

# CORS Configuration
CORS(app, 
     origins=['http://localhost:5173', 'http://localhost:3000'],
     supports_credentials=True,
     allow_headers=['Content-Type', 'Authorization'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

# Configuration - Use existing piring directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PIRING_DIR = os.path.join(BASE_DIR, 'piring')
RINGTIMES_PATH = os.path.join(PIRING_DIR, 'ringtimes')
RINGDATES_PATH = os.path.join(PIRING_DIR, 'ringdates')

# New data files for web interface
DATA_DIR = os.path.join(BASE_DIR, 'data')
SCHEDULES_FILE = os.path.join(DATA_DIR, 'schedules.json')
ASSIGNMENTS_FILE = os.path.join(DATA_DIR, 'assignments.json')

# Create data directory
os.makedirs(DATA_DIR, exist_ok=True)

# Users
USERS = {
    'boo@crics.asia': {
        'password_hash': generate_password_hash('boo123'),
        'name': 'Boo'
    }
}

# Session config
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SECURE'] = False  # Set to True in production with HTTPS
app.config['PERMANENT_SESSION_LIFETIME'] = 1800
app.config['SESSION_COOKIE_DOMAIN'] = None

# Default color presets
DEFAULT_COLORS = {
    "Normal": {"name": "Yellow", "value": "#fef3c7", "border": "#fde047", "text": "#854d0e"},
    "Late Start": {"name": "Blue", "value": "#dbeafe", "border": "#60a5fa", "text": "#1e3a8a"},
    "Buddy": {"name": "Green", "value": "#d1fae5", "border": "#34d399", "text": "#065f46"},
    "Assembly": {"name": "Purple", "value": "#e9d5ff", "border": "#a78bfa", "text": "#5b21b6"}
}

# ============================================================================
# HELPER FUNCTIONS - Parse existing ringtimes format
# ============================================================================

def parse_ringtimes():
    """Parse the existing ringtimes file into structured data"""
    schedules = []
    
    if not os.path.exists(RINGTIMES_PATH):
        return schedules
    
    try:
        with open(RINGTIMES_PATH, 'r') as f:
            lines = f.readlines()
        
        current_schedule = None
        schedule_id = 1
        
        for line in lines:
            line = line.strip()
            
            # Skip empty lines and comments
            if not line or line.startswith('#'):
                continue
            
            # Check if this is a schedule header (contains letters indicating mode)
            parts = line.split()
            if len(parts) >= 2:
                time_part = parts[0]
                mode_part = parts[1]
                
                # If mode_part contains letters, it's a schedule identifier
                if any(c.isalpha() for c in mode_part):
                    # Save previous schedule if exists
                    if current_schedule and current_schedule['times']:
                        schedules.append(current_schedule)
                    
                    # Determine schedule type from mode code
                    mode_name = "Normal"
                    schedule_name = "Normal Schedule"
                    
                    if 'L' in mode_part:
                        mode_name = "Late Start"
                        schedule_name = "Late Start Schedule"
                    elif 'B' in mode_part:
                        mode_name = "Buddy"
                        schedule_name = "Buddy Schedule"
                    elif 'A' in mode_part:
                        mode_name = "Assembly"
                        schedule_name = "Assembly Schedule"
                    
                    # Get default color for this mode
                    default_color = DEFAULT_COLORS.get(mode_name, DEFAULT_COLORS["Normal"])
                    
                    # Start new schedule
                    current_schedule = {
                        'id': str(schedule_id),
                        'name': schedule_name,
                        'mode': mode_name,
                        'original_code': mode_part,
                        'color': default_color,
                        'bellSoundId': None,  # Initialize bell sound field
                        'times': []
                    }
                    schedule_id += 1
                    
                    # Add the first time
                    description = ' '.join(parts[2:]) if len(parts) > 2 else f"Bell {time_part}"
                    current_schedule['times'].append({
                        'time': time_part,
                        'description': description
                    })
                else:
                    # This is a continuation of the current schedule
                    if current_schedule:
                        description = ' '.join(parts[1:]) if len(parts) > 1 else f"Bell {time_part}"
                        current_schedule['times'].append({
                            'time': time_part,
                            'description': description
                        })
        
        # Add the last schedule
        if current_schedule and current_schedule['times']:
            schedules.append(current_schedule)
            
    except Exception as e:
        print(f"Error parsing ringtimes: {e}")
    
    return schedules

def parse_ringdates():
    """Parse the existing ringdates file into assignments"""
    assignments = []
    
    if not os.path.exists(RINGDATES_PATH):
        return assignments
    
    try:
        with open(RINGDATES_PATH, 'r') as f:
            lines = f.readlines()
        
        for line in lines:
            line = line.strip()
            
            # Skip empty lines and comments
            if not line or line.startswith('#'):
                continue
            
            parts = line.split()
            if len(parts) >= 2:
                date_str = parts[0]  # Format: YYYY-MM-DD
                mode_code = parts[1]
                description = ' '.join(parts[2:]) if len(parts) > 2 else ''
                
                assignments.append({
                    'id': f"{date_str}_{mode_code}",
                    'date': date_str,
                    'mode_code': mode_code,
                    'scheduleId': None,  # Will be matched later
                    'description': description
                })
                
    except Exception as e:
        print(f"Error parsing ringdates: {e}")
    
    return assignments

def init_data_files():
    """Initialize JSON data files from existing ringtimes/ringdates if they don't exist"""
    
    # Initialize schedules from ringtimes
    if not os.path.exists(SCHEDULES_FILE):
        schedules = parse_ringtimes()
        
        # If no ringtimes, use defaults
        if not schedules:
            schedules = [
                {
                    "id": "1",
                    "name": "Normal Schedule",
                    "mode": "Normal",
                    "isDefault": True,
                    "color": DEFAULT_COLORS["Normal"],
                    "bellSoundId": None,
                    "times": [
                        {"time": "09:00", "description": "1st period"},
                        {"time": "10:00", "description": "2nd period"},
                        {"time": "10:30", "description": "Morning break"},
                        {"time": "11:00", "description": "3rd period"},
                        {"time": "12:00", "description": "Lunch break"},
                        {"time": "13:00", "description": "4th period"},
                        {"time": "14:00", "description": "5th period"},
                        {"time": "15:00", "description": "School end"}
                    ]
                }
            ]
        else:
            # Set first schedule as default
            schedules[0]['isDefault'] = True
        
        with open(SCHEDULES_FILE, 'w') as f:
            json.dump(schedules, f, indent=2)
    
    # Initialize assignments from ringdates
    if not os.path.exists(ASSIGNMENTS_FILE):
        assignments = parse_ringdates()
        
        # Match assignments to schedule IDs
        schedules = load_schedules()
        for assignment in assignments:
            mode_code = assignment.get('mode_code', '')
            
            # Match mode code to schedule
            for schedule in schedules:
                original_code = schedule.get('original_code', '')
                if original_code and mode_code in original_code:
                    assignment['scheduleId'] = schedule['id']
                    break
        
        with open(ASSIGNMENTS_FILE, 'w') as f:
            json.dump(assignments, f, indent=2)

# Helper functions for JSON data
def load_schedules():
    try:
        with open(SCHEDULES_FILE, 'r') as f:
            schedules = json.load(f)
            
        # Ensure all schedules have required fields
        for schedule in schedules:
            # Ensure color field exists
            if 'color' not in schedule:
                mode = schedule.get('mode', 'Normal')
                schedule['color'] = DEFAULT_COLORS.get(mode, DEFAULT_COLORS["Normal"])
            
            # Ensure bellSoundId field exists (can be None)
            if 'bellSoundId' not in schedule:
                schedule['bellSoundId'] = None
        
        return schedules
    except:
        return []

def save_schedules(schedules):
    try:
        with open(SCHEDULES_FILE, 'w') as f:
            json.dump(schedules, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving schedules: {e}")
        return False

def load_assignments():
    try:
        with open(ASSIGNMENTS_FILE, 'r') as f:
            return json.load(f)
    except:
        return []

def save_assignments(assignments):
    try:
        with open(ASSIGNMENTS_FILE, 'w') as f:
            json.dump(assignments, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving assignments: {e}")
        return False

# Initialize data
init_data_files()

# ============================================================================
# AUTHENTICATION
# ============================================================================

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'logged_in' not in session:
            return jsonify({'error': 'Not authenticated'}), 401
        return f(*args, **kwargs)
    return decorated_function

@app.route('/api/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return '', 200
        
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    user = USERS.get(email)
    
    if user and check_password_hash(user['password_hash'], password):
        session.permanent = True
        session['logged_in'] = True
        session['user'] = email
        session['name'] = user['name']
        return jsonify({
            'success': True,
            'user': {
                'email': email,
                'name': user['name']
            }
        })
    else:
        return jsonify({'error': 'Invalid email or password'}), 401

@app.route('/api/logout', methods=['POST', 'OPTIONS'])
def logout():
    if request.method == 'OPTIONS':
        return '', 200
        
    session.clear()
    return jsonify({'success': True})

@app.route('/api/check-auth', methods=['GET'])
def check_auth():
    if 'logged_in' in session:
        return jsonify({
            'authenticated': True, 
            'user': {
                'email': session.get('user'),
                'name': session.get('name')
            }
        })
    return jsonify({'authenticated': False}), 401

# ============================================================================
# SCHEDULES API (UPDATED WITH BELL SOUND SUPPORT)
# ============================================================================

@app.route('/api/schedules', methods=['GET'])
@login_required
def get_schedules():
    schedules = load_schedules()
    return jsonify(schedules)

@app.route('/api/schedules', methods=['POST'])
@login_required
def create_schedule():
    schedules = load_schedules()
    new_schedule = request.json
    
    if not new_schedule.get('name') or not new_schedule.get('mode'):
        return jsonify({'error': 'Name and mode are required'}), 400
    
    new_schedule['id'] = str(int(datetime.now().timestamp() * 1000))
    
    # Ensure isDefault is set
    if 'isDefault' not in new_schedule:
        new_schedule['isDefault'] = False
    
    # Ensure color is set
    if 'color' not in new_schedule:
        mode = new_schedule.get('mode', 'Normal')
        new_schedule['color'] = DEFAULT_COLORS.get(mode, DEFAULT_COLORS["Normal"])
    
    # Handle bellSoundId - can be None or a valid sound ID
    bell_sound_id = new_schedule.get('bellSoundId')
    if bell_sound_id:
        # Validate bell sound exists
        bell_sounds = load_bell_sounds_meta()
        if not any(sound['id'] == bell_sound_id for sound in bell_sounds):
            return jsonify({'error': 'Invalid bell sound ID'}), 400
        new_schedule['bellSoundId'] = bell_sound_id
    else:
        new_schedule['bellSoundId'] = None
    
    schedules.append(new_schedule)
    
    if save_schedules(schedules):
        return jsonify(new_schedule), 201
    return jsonify({'error': 'Failed to save schedule'}), 500

@app.route('/api/schedules/<schedule_id>', methods=['PUT'])
@login_required
def update_schedule(schedule_id):
    schedules = load_schedules()
    updated_data = request.json
    
    for i, schedule in enumerate(schedules):
        if schedule['id'] == schedule_id:
            # Preserve ID
            schedules[i] = {**updated_data, 'id': schedule_id}
            
            # Ensure color is preserved or set
            if 'color' not in schedules[i]:
                mode = schedules[i].get('mode', 'Normal')
                schedules[i]['color'] = DEFAULT_COLORS.get(mode, DEFAULT_COLORS["Normal"])
            
            # Handle bellSoundId update
            bell_sound_id = updated_data.get('bellSoundId')
            if bell_sound_id:
                # Validate bell sound exists
                bell_sounds = load_bell_sounds_meta()
                if not any(sound['id'] == bell_sound_id for sound in bell_sounds):
                    return jsonify({'error': 'Invalid bell sound ID'}), 400
                schedules[i]['bellSoundId'] = bell_sound_id
            else:
                # Explicitly set to None if not provided or empty
                schedules[i]['bellSoundId'] = None
            
            if save_schedules(schedules):
                return jsonify(schedules[i])
            return jsonify({'error': 'Failed to update schedule'}), 500
    
    return jsonify({'error': 'Schedule not found'}), 404

@app.route('/api/schedules/<schedule_id>', methods=['DELETE'])
@login_required
def delete_schedule(schedule_id):
    schedules = load_schedules()
    schedules = [s for s in schedules if s['id'] != schedule_id]
    
    if not save_schedules(schedules):
        return jsonify({'error': 'Failed to delete schedule'}), 500
    
    # Also remove assignments for this schedule
    assignments = load_assignments()
    assignments = [a for a in assignments if a['scheduleId'] != schedule_id]
    save_assignments(assignments)
    
    return jsonify({'success': True})

# ============================================================================
# ASSIGNMENTS API
# ============================================================================

@app.route('/api/assignments', methods=['GET'])
@login_required
def get_assignments():
    assignments = load_assignments()
    return jsonify(assignments)

@app.route('/api/assignments', methods=['POST'])
@login_required
def create_assignment():
    assignments = load_assignments()
    data = request.json
    dates = data.get('dates', [])
    schedule_id = data.get('scheduleId')
    description = data.get('description', '')
    custom_times = data.get('customTimes')
    bell_sound_id = data.get('bellSoundId')
    
    if not dates or not schedule_id:
        return jsonify({'error': 'Dates and scheduleId are required'}), 400
    
    # Validate bell sound if provided
    if bell_sound_id:
        bell_sounds = load_bell_sounds_meta()
        if not any(sound['id'] == bell_sound_id for sound in bell_sounds):
            return jsonify({'error': 'Invalid bell sound ID'}), 400
    
    created_assignments = []
    for date in dates:
        new_assignment = {
            'id': str(int(datetime.now().timestamp() * 1000)) + str(len(assignments)),
            'date': date,
            'scheduleId': schedule_id,
            'description': description
        }
        
        # Only add customTimes if provided
        if custom_times:
            new_assignment['customTimes'] = custom_times
        
        # Add bellSoundId if provided (can override schedule's default)
        if bell_sound_id is not None:
            new_assignment['bellSoundId'] = bell_sound_id
            
        assignments.append(new_assignment)
        created_assignments.append(new_assignment)
    
    if save_assignments(assignments):
        return jsonify({'success': True, 'assignments': created_assignments}), 201
    return jsonify({'error': 'Failed to save assignment'}), 500

@app.route('/api/assignments/<assignment_id>', methods=['PUT'])
@login_required
def update_assignment(assignment_id):
    assignments = load_assignments()
    data = request.json
    
    # Find the assignment to update
    for i, assignment in enumerate(assignments):
        if assignment['id'] == assignment_id:
            # Update the assignment with new data
            assignments[i] = {
                'id': assignment_id,  # Keep the same ID
                'date': data.get('date', assignment['date']),
                'scheduleId': data.get('scheduleId', assignment['scheduleId']),
                'description': data.get('description', assignment.get('description', ''))
            }
            
            # Handle customTimes - only add if provided, otherwise remove it
            if 'customTimes' in data:
                if data['customTimes'] is not None:
                    assignments[i]['customTimes'] = data['customTimes']
                # If customTimes is explicitly None, remove it from the assignment
                elif 'customTimes' in assignments[i]:
                    del assignments[i]['customTimes']
            
            # Handle bellSoundId - can override schedule's default
            if 'bellSoundId' in data:
                bell_sound_id = data['bellSoundId']
                
                # Validate bell sound if provided and not null
                if bell_sound_id:
                    bell_sounds = load_bell_sounds_meta()
                    if not any(sound['id'] == bell_sound_id for sound in bell_sounds):
                        return jsonify({'error': 'Invalid bell sound ID'}), 400
                    assignments[i]['bellSoundId'] = bell_sound_id
                else:
                    # If null, remove the field to use schedule default
                    if 'bellSoundId' in assignments[i]:
                        del assignments[i]['bellSoundId']
            
            if save_assignments(assignments):
                return jsonify(assignments[i])
            return jsonify({'error': 'Failed to update assignment'}), 500
    
    return jsonify({'error': 'Assignment not found'}), 404

@app.route('/api/assignments/<assignment_id>', methods=['DELETE'])
@login_required
def delete_assignment(assignment_id):
    assignments = load_assignments()
    assignments = [a for a in assignments if a['id'] != assignment_id]
    
    if save_assignments(assignments):
        return jsonify({'success': True})
    return jsonify({'error': 'Failed to delete assignment'}), 500

# ============================================================================
# LEGACY ENDPOINTS (for backward compatibility)
# ============================================================================

@app.route('/api/schedule/times', methods=['GET'])
@login_required
def get_schedule_times():
    try:
        with open(RINGTIMES_PATH, 'r') as f:
            content = f.read()
        
        return jsonify({
            'success': True,
            'content': content,
            'path': RINGTIMES_PATH
        })
    except FileNotFoundError:
        return jsonify({
            'success': False,
            'error': 'Ringtimes file not found'
        }), 404
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok', 
        'message': 'Bell Schedule API is running',
        'ringtimes_exists': os.path.exists(RINGTIMES_PATH),
        'ringdates_exists': os.path.exists(RINGDATES_PATH)
    })

# ============================================================================
# BELL SOUNDS API
# ============================================================================

BELL_SOUNDS_DIR = os.path.join(DATA_DIR, 'bell_sounds')
BELL_SOUNDS_META_FILE = os.path.join(DATA_DIR, 'bell_sounds_meta.json')

# Create bell sounds directory
os.makedirs(BELL_SOUNDS_DIR, exist_ok=True)

def load_bell_sounds_meta():
    try:
        with open(BELL_SOUNDS_META_FILE, 'r') as f:
            return json.load(f)
    except:
        return []

def save_bell_sounds_meta(meta):
    try:
        with open(BELL_SOUNDS_META_FILE, 'w') as f:
            json.dump(meta, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving bell sounds meta: {e}")
        return False

@app.route('/api/bell-sounds', methods=['GET'])
@login_required
def get_bell_sounds():
    meta = load_bell_sounds_meta()
    return jsonify(meta)

@app.route('/api/bell-sounds', methods=['POST'])
@login_required
def upload_bell_sound():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Validate file type
        allowed_extensions = {'mp3', 'wav', 'ogg', 'm4a', 'aac'}
        file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
        
        if file_ext not in allowed_extensions:
            return jsonify({'error': 'Invalid file type. Allowed: MP3, WAV, OGG, M4A, AAC'}), 400
        
        # Create unique filename
        timestamp = int(datetime.now().timestamp() * 1000)
        safe_filename = f"{timestamp}_{file.filename}"
        file_path = os.path.join(BELL_SOUNDS_DIR, safe_filename)
        
        # Save file
        file.save(file_path)
        file_size = os.path.getsize(file_path)
        
        # Create metadata
        meta = load_bell_sounds_meta()
        new_sound = {
            'id': str(timestamp),
            'name': file.filename.rsplit('.', 1)[0],
            'fileName': file.filename,
            'savedFileName': safe_filename,
            'size': file_size,
            'uploadedAt': datetime.now().isoformat()
        }
        
        meta.append(new_sound)
        save_bell_sounds_meta(meta)
        
        return jsonify(new_sound), 201
        
    except Exception as e:
        print(f"Error uploading bell sound: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/bell-sounds/<sound_id>', methods=['GET'])
@login_required
def get_bell_sound_file(sound_id):
    try:
        meta = load_bell_sounds_meta()
        sound = next((s for s in meta if s['id'] == sound_id), None)
        
        if not sound:
            return jsonify({'error': 'Sound not found'}), 404
        
        file_path = os.path.join(BELL_SOUNDS_DIR, sound['savedFileName'])
        
        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found'}), 404
        
        return send_file(file_path, mimetype='audio/mpeg')
        
    except Exception as e:
        print(f"Error getting bell sound file: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/bell-sounds/<sound_id>', methods=['PUT'])
@login_required
def update_bell_sound(sound_id):
    try:
        data = request.json
        meta = load_bell_sounds_meta()
        
        for i, sound in enumerate(meta):
            if sound['id'] == sound_id:
                meta[i]['name'] = data.get('name', sound['name'])
                save_bell_sounds_meta(meta)
                return jsonify(meta[i])
        
        return jsonify({'error': 'Sound not found'}), 404
        
    except Exception as e:
        print(f"Error updating bell sound: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/bell-sounds/<sound_id>', methods=['DELETE'])
@login_required
def delete_bell_sound(sound_id):
    try:
        meta = load_bell_sounds_meta()
        sound = next((s for s in meta if s['id'] == sound_id), None)
        
        if not sound:
            return jsonify({'error': 'Sound not found'}), 404
        
        # Update any schedules using this sound to null
        schedules = load_schedules()
        schedules_updated = False
        for schedule in schedules:
            if schedule.get('bellSoundId') == sound_id:
                schedule['bellSoundId'] = None
                schedules_updated = True
        
        if schedules_updated:
            save_schedules(schedules)
            print(f"Updated schedules to remove bell sound reference: {sound_id}")
        
        # Update any assignments using this sound to remove the override
        assignments = load_assignments()
        assignments_updated = False
        for assignment in assignments:
            if assignment.get('bellSoundId') == sound_id:
                del assignment['bellSoundId']
                assignments_updated = True
        
        if assignments_updated:
            save_assignments(assignments)
            print(f"Updated assignments to remove bell sound reference: {sound_id}")
        
        # Delete file
        file_path = os.path.join(BELL_SOUNDS_DIR, sound['savedFileName'])
        if os.path.exists(file_path):
            os.remove(file_path)
        
        # Update metadata
        meta = [s for s in meta if s['id'] != sound_id]
        save_bell_sounds_meta(meta)
        
        return jsonify({'success': True})
        
    except Exception as e:
        print(f"Error deleting bell sound: {e}")
        return jsonify({'error': str(e)}), 500

# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    print("🔔 Bell Schedule Management System")
    print(f"📂 Piring directory: {PIRING_DIR}")
    print(f"📄 Ringtimes: {RINGTIMES_PATH} - {'✅ Found' if os.path.exists(RINGTIMES_PATH) else '❌ Not found'}")
    print(f"📄 Ringdates: {RINGDATES_PATH} - {'✅ Found' if os.path.exists(RINGDATES_PATH) else '❌ Not found'}")
    print(f"💾 Data directory: {DATA_DIR}")
    print()
    print("✅ Backend running on: http://localhost:5001")
    print("📡 Accepting requests from: http://localhost:3000, http://localhost:5173")
    print()
    
    app.run(debug=True, host='0.0.0.0', port=5001)