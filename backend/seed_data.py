#!/usr/bin/env python3
"""
Seed script - inserts all schedules and historical table rows into PostgreSQL.
Run on the Pi: python3 seed_data.py
"""

import psycopg2
import psycopg2.extras
import json
import os

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://boo:boo123@localhost/belldb')

def get_db():
    return psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)

# ============================================================================
# SCHEDULES
# ============================================================================

SCHEDULES = [
    # Replacement schedules (no +)
    {"id": "schedule-X",      "code": "X",   "name": "Closed / In-Service",              "color": "#dc2626", "is_addon": False, "bell_slot": 0, "times": []},
    {"id": "schedule-Z",      "code": "Z",   "name": "School Closed",                    "color": "#6b7280", "is_addon": False, "bell_slot": 0, "times": []},
    {"id": "schedule-hash",   "code": "#",   "name": "Special Event",                    "color": "#9ca3af", "is_addon": False, "bell_slot": 0, "times": []},
    {"id": "schedule-hashZ",  "code": "#Z",  "name": "School Closed (Cancelled)",        "color": "#9ca3af", "is_addon": False, "bell_slot": 0, "times": []},
    {"id": "schedule-hashX",  "code": "#X",  "name": "In-Service (Cancelled)",           "color": "#fca5a5", "is_addon": False, "bell_slot": 0, "times": []},
    {"id": "schedule-hashL",  "code": "#L",  "name": "Late Start (Cancelled)",           "color": "#93c5fd", "is_addon": False, "bell_slot": 0, "times": []},
    {"id": "schedule-hashH",  "code": "#H",  "name": "Open House (Special)",             "color": "#bae6fd", "is_addon": False, "bell_slot": 0, "times": []},
    {"id": "schedule-q",      "code": "q",   "name": "Sports Day",                       "color": "#059669", "is_addon": False, "bell_slot": 0, "times": [
        {"time": "09:15", "label": "Game 1",    "muted": False},
        {"time": "09:50", "label": "Game 2",    "muted": False},
        {"time": "10:25", "label": "Break",     "muted": False},
        {"time": "10:30", "label": "Game 3",    "muted": False},
        {"time": "11:05", "label": "Game 4",    "muted": False},
        {"time": "11:40", "label": "Lunch",     "muted": False},
        {"time": "12:10", "label": "Game 5",    "muted": False},
        {"time": "12:45", "label": "Game 6",    "muted": False},
        {"time": "13:15", "label": "Finals",    "muted": False},
        {"time": "14:00", "label": "School end","muted": False},
    ]},
    {"id": "schedule-L",      "code": "L",   "name": "Late Start",                       "color": "#1d4ed8", "is_addon": False, "bell_slot": 0, "times": [
        {"time": "08:55", "label": "Pre-1st period",  "muted": False},
        {"time": "09:00", "label": "1st period",      "muted": False},
        {"time": "09:40", "label": "Pre-2nd period",  "muted": False},
        {"time": "09:45", "label": "2nd period",      "muted": False},
        {"time": "10:25", "label": "Morning break",   "muted": False},
        {"time": "10:30", "label": "Pre-3rd period",  "muted": False},
        {"time": "10:35", "label": "3rd period",      "muted": False},
        {"time": "11:15", "label": "Pre-4th period",  "muted": False},
        {"time": "11:20", "label": "4th period",      "muted": False},
        {"time": "12:00", "label": "Lunch break",     "muted": False},
        {"time": "12:40", "label": "Pre-5th period",  "muted": False},
        {"time": "12:45", "label": "5th period",      "muted": False},
        {"time": "13:25", "label": "Pre-6th period",  "muted": False},
        {"time": "13:30", "label": "6th period",      "muted": False},
        {"time": "14:10", "label": "Pre-7th period",  "muted": False},
        {"time": "14:15", "label": "7th period",      "muted": False},
        {"time": "14:55", "label": "Pre-8th period",  "muted": False},
        {"time": "15:00", "label": "8th period",      "muted": False},
        {"time": "15:40", "label": "School end",      "muted": False},
    ]},

    # Addon schedules (with +)
    {"id": "schedule-B",      "code": "B",   "name": "Buddy Classes",                    "color": "#7c3aed", "is_addon": True,  "bell_slot": 0, "times": [
        {"time": "07:55", "label": "Pre-Buddy Class", "muted": False},
        {"time": "08:00", "label": "Buddy Class",     "muted": False},
    ]},
    {"id": "schedule-cplus",  "code": "c+",  "name": "Chapel (Longbell)",                "color": "#0891b2", "is_addon": True,  "bell_slot": 8, "times": [
        {"time": "08:50", "label": "Longbell to end chapel gently", "muted": False},
    ]},
    {"id": "schedule-splus",  "code": "s+",  "name": "Sports Day Meeting",               "color": "#059669", "is_addon": True,  "bell_slot": 5, "times": [
        {"time": "11:55", "label": "Meet after 15 minutes of lunch (ring-half)", "muted": False},
    ]},
    {"id": "schedule-Eplus",  "code": "E+",  "name": "Only Elementary",                  "color": "#ea580c", "is_addon": True,  "bell_slot": 0, "times": [
        {"time": "09:50", "label": "No Pre-3rd period",      "muted": True},
        {"time": "09:55", "label": "No 3rd period",          "muted": True},
        {"time": "14:00", "label": "Elementary break: bell!","muted": False},
    ]},
    {"id": "schedule-tplus",  "code": "t+",  "name": "School Ends at 14:10",             "color": "#ca8a04", "is_addon": True,  "bell_slot": 0, "times": [
        {"time": "14:15", "label": "7th (shorter) period",  "muted": True},
        {"time": "14:55", "label": "Pre-8th period",         "muted": True},
        {"time": "15:00", "label": "8th (shorter) period",  "muted": True},
        {"time": "15:40", "label": "School End",             "muted": True},
    ]},
    {"id": "schedule-Tplus",  "code": "T+",  "name": "School Ends at 12:30",             "color": "#dc2626", "is_addon": True,  "bell_slot": 0, "times": [
        {"time": "12:20", "label": "Pre-5th period",         "muted": True},
        {"time": "12:25", "label": "5th (shorter) period",  "muted": True},
        {"time": "13:15", "label": "Pre-6th period",         "muted": True},
        {"time": "13:20", "label": "6th (shorter) period",  "muted": True},
        {"time": "14:10", "label": "Pre-7th period",         "muted": True},
        {"time": "14:15", "label": "7th (shorter) period",  "muted": True},
        {"time": "14:55", "label": "Pre-8th period",         "muted": True},
        {"time": "15:00", "label": "8th (shorter) period",  "muted": True},
        {"time": "15:40", "label": "School End",             "muted": True},
    ]},
    {"id": "schedule-Iplus",  "code": "I+",  "name": "International Day",                "color": "#7c3aed", "is_addon": True,  "bell_slot": 0, "times": [
        {"time": "08:50", "label": "Pre-2nd period",                  "muted": True},
        {"time": "08:55", "label": "2nd period",                      "muted": True},
        {"time": "09:45", "label": "Morning Break",                   "muted": True},
        {"time": "09:50", "label": "Pre-3rd period",                  "muted": True},
        {"time": "09:55", "label": "3rd period (Elementary break end)","muted": True},
        {"time": "10:00", "label": "(Elementary restart)",            "muted": True},
    ]},
    {"id": "schedule-Pplus",  "code": "P+",  "name": "No Classes After Lunch",           "color": "#0891b2", "is_addon": True,  "bell_slot": 0, "times": [
        {"time": "12:25", "label": "5th period",    "muted": True},
        {"time": "13:15", "label": "Pre-6th period","muted": True},
        {"time": "13:20", "label": "6th period",    "muted": True},
        {"time": "14:10", "label": "Pre-7th period","muted": True},
        {"time": "14:15", "label": "7th period",    "muted": True},
        {"time": "14:55", "label": "Pre-8th period","muted": True},
        {"time": "15:00", "label": "8th period",    "muted": True},
        {"time": "15:40", "label": "School end",    "muted": True},
    ]},
    {"id": "schedule-eplus",  "code": "e+",  "name": "No Elementary",                    "color": "#f97316", "is_addon": True,  "bell_slot": 0, "times": [
        {"time": "10:00", "label": "No bell", "muted": True},
    ]},
    {"id": "schedule-lplus",  "code": "l+",  "name": "School Ends at 14:00",             "color": "#ca8a04", "is_addon": True,  "bell_slot": 0, "times": [
        {"time": "14:00", "label": "Last Bell",  "muted": False},
        {"time": "14:10", "label": "No Bell",    "muted": True},
    ]},
    {"id": "schedule-Splus",  "code": "S+",  "name": "Elementary Ends at 14:00",         "color": "#16a34a", "is_addon": True,  "bell_slot": 0, "times": [
        {"time": "14:00", "label": "Final bell Elementary", "muted": False},
    ]},
    {"id": "schedule-Yplus",  "code": "Y+",  "name": "Youth Retreat (after 10am)",       "color": "#9333ea", "is_addon": True,  "bell_slot": 0, "times": [
        {"time": "10:45", "label": "Pre-4th period", "muted": True},
        {"time": "10:50", "label": "4th period",     "muted": True},
        {"time": "11:40", "label": "Lunch break",    "muted": True},
        {"time": "12:20", "label": "Pre-5th period", "muted": True},
        {"time": "12:25", "label": "5th period",     "muted": True},
        {"time": "13:15", "label": "Pre-6th period", "muted": True},
        {"time": "13:20", "label": "6th period",     "muted": True},
        {"time": "14:10", "label": "Pre-7th period", "muted": True},
        {"time": "14:15", "label": "7th period",     "muted": True},
        {"time": "14:55", "label": "Pre-8th period", "muted": True},
        {"time": "15:00", "label": "8th period",     "muted": True},
        {"time": "15:40", "label": "School end",     "muted": True},
    ]},
    {"id": "schedule-Hplus",  "code": "H+",  "name": "Secondary Open House",             "color": "#0369a1", "is_addon": True,  "bell_slot": 5, "times": [
        {"time": "18:30", "label": "Auditorium 1",               "muted": False},
        {"time": "18:36", "label": "Auditorium 2",               "muted": False},
        {"time": "18:42", "label": "Move",                        "muted": False},
        {"time": "18:48", "label": "1st",                         "muted": False},
        {"time": "18:54", "label": "Move",                        "muted": False},
        {"time": "19:00", "label": "2nd",                         "muted": False},
        {"time": "19:06", "label": "Move",                        "muted": False},
        {"time": "19:12", "label": "3rd",                         "muted": False},
        {"time": "19:18", "label": "Move",                        "muted": False},
        {"time": "19:24", "label": "4th",                         "muted": False},
        {"time": "19:30", "label": "Move",                        "muted": False},
        {"time": "19:36", "label": "5th",                         "muted": False},
        {"time": "19:42", "label": "Move",                        "muted": False},
        {"time": "19:48", "label": "6th",                         "muted": False},
        {"time": "19:54", "label": "Move",                        "muted": False},
        {"time": "20:00", "label": "Snack & connect in Auditorium","muted": False},
    ]},
    {"id": "schedule-hashHplus","code": "#H+","name": "Open House (Special, Addon)",     "color": "#bae6fd", "is_addon": True,  "bell_slot": 0, "times": []},
    {"id": "schedule-hashtplus","code": "#t+","name": "School Ends 14:00 (Special)",     "color": "#fde68a", "is_addon": True,  "bell_slot": 0, "times": []},
    {"id": "schedule-p",      "code": "p",   "name": "No Afternoon (Late Start)",        "color": "#94a3b8", "is_addon": True,  "bell_slot": 0, "times": [
        {"time": "12:40", "label": "No bell", "muted": True},
        {"time": "12:45", "label": "No bell", "muted": True},
        {"time": "13:25", "label": "No bell", "muted": True},
        {"time": "13:30", "label": "No bell", "muted": True},
        {"time": "14:10", "label": "No bell", "muted": True},
        {"time": "14:15", "label": "No bell", "muted": True},
        {"time": "14:55", "label": "No bell", "muted": True},
        {"time": "15:00", "label": "No bell", "muted": True},
        {"time": "15:40", "label": "No bell", "muted": True},
    ]},
    {"id": "schedule-m",      "code": "m",   "name": "Shortened Lunch (Late Start)",     "color": "#94a3b8", "is_addon": True,  "bell_slot": 0, "times": [
        {"time": "12:20", "label": "Shortened lunch",          "muted": False},
        {"time": "12:45", "label": "No extra bell at 12:45",   "muted": True},
    ]},
    {"id": "schedule-Qplus",  "code": "Q+",  "name": "No Lunch Bells",                   "color": "#94a3b8", "is_addon": True,  "bell_slot": 0, "times": []},
    {"id": "schedule-nplus",  "code": "n+",  "name": "Noon Bell (instead of 12:20)",     "color": "#94a3b8", "is_addon": True,  "bell_slot": 0, "times": [
        {"time": "12:00", "label": "Noon bell instead of 12:20pm", "muted": False},
    ]},
    {"id": "schedule-Gplus",  "code": "G+",  "name": "Game Afternoon",                   "color": "#059669", "is_addon": True,  "bell_slot": 0, "times": []},
    {"id": "schedule-Cplus",  "code": "C+",  "name": "Elementary Closed",                "color": "#ea580c", "is_addon": True,  "bell_slot": 0, "times": []},
]

# ============================================================================
# TABLE ROWS
# ============================================================================

TABLE_ROWS = [
    # ── 2025/2026 ──────────────────────────────────────────────────────────
    ("X",   "2025-08-04", "2025-08-12", "(New) Teacher Orientation and Welcoming Students"),
    ("S+",  "2025-08-13", "2025-08-15", "Elementary ends at 2pm"),
    ("H+",  "2025-08-28", None,         "Secondary Student Open House"),
    ("L",   "2025-09-12", None,         "Late Start schedule"),
    ("Y+",  "2025-09-18", None,         "Youth Retreat after 10am"),
    ("X",   "2025-09-19", None,         "Youth Retreat and Elementary day off"),
    ("X",   "2025-10-10", None,         "In-service"),
    ("Z",   "2025-10-13", None,         "Closed"),
    ("B",   "2025-10-16", None,         "Math Buddy classes"),
    ("L",   "2025-10-16", None,         "Late Start schedule"),
    ("L",   "2025-10-17", None,         "Late Start schedule"),
    ("Z",   "2025-10-23", None,         "Chulalongkorn Day"),
    ("#",   "2025-10-31", None,         "Harvest Festival"),
    ("e+",  "2025-11-03", None,         "No Elementary"),
    ("L",   "2025-11-07", None,         "Late Start schedule"),
    ("E+",  "2025-11-14", None,         "Secondary Thai Field Trip: Only Elementary"),
    ("T+",  "2025-11-27", None,         "Thanksgiving No bells afternoon"),
    ("Z",   "2025-12-05", None,         "Father's Day"),
    ("Z",   "2025-12-10", None,         "Constitution Day"),
    ("L",   "2025-12-12", None,         "Late Start schedule"),
    ("l+",  "2025-12-19", None,         "Last bell at 14:00, no bell at 14:10"),
    ("t+",  "2025-12-19", None,         "Last bell at 14:15"),
    ("Z",   "2025-12-22", "2026-01-02", "Christmas Break"),
    ("X",   "2026-01-05", None,         "Teachers Work Day"),
    ("t+",  "2026-01-15", None,         "Wai Kru Day"),
    ("X",   "2026-01-19", None,         "In-service"),
    ("s+",  "2026-01-21", None,         "Sports Day Meeting"),
    ("s+",  "2026-01-27", None,         "Sports Day Meeting"),
    ("X",   "2026-02-04", None,         "Sports Day"),
    ("Z",   "2026-02-06", None,         "Closed Family Weekend"),
    ("L",   "2026-02-13", None,         "Late Start schedule"),
    ("B",   "2026-02-27", None,         "SS Buddy Class"),
    ("L",   "2026-02-27", None,         "Late Start schedule"),
    ("X",   "2026-03-13", None,         "In-service"),
    ("L",   "2026-03-20", None,         "Late Start schedule"),
    ("t+",  "2026-04-03", None,         "Songkran celebration (No bell after 2:10 pm)"),
    ("Z",   "2026-04-06", "2026-04-17", "Songkran Break"),
    ("L",   "2026-05-08", None,         "Late Start schedule"),
    ("X",   "2026-05-22", None,         "Last Day of School"),
    ("X",   "2026-05-25", None,         "Teachers Work Day"),
    ("#Z",  "2026-05-26", "2026-08-11", "Summer Break"),
    # c+ 2025/2026
    ("c+",  "2025-08-26", None, "No bell after chapel"),
    ("c+",  "2025-09-02", None, "No bell after chapel"),
    ("c+",  "2025-09-09", None, "No bell after chapel"),
    ("c+",  "2025-09-16", None, "No bell after chapel"),
    ("c+",  "2025-09-23", None, "No bell after chapel"),
    ("c+",  "2025-09-30", None, "No bell after chapel"),
    ("c+",  "2025-10-07", None, "No bell after chapel"),
    ("c+",  "2025-10-14", None, "No bell after chapel"),
    ("c+",  "2025-10-21", None, "No bell after chapel"),
    ("c+",  "2025-10-28", None, "No bell after chapel"),
    ("c+",  "2025-11-04", None, "No bell after chapel"),
    ("c+",  "2025-11-11", None, "No bell after chapel"),
    ("c+",  "2025-11-18", None, "No bell after chapel"),
    ("c+",  "2025-11-25", None, "No bell after chapel"),
    ("c+",  "2025-12-01", None, "No bell after chapel"),
    ("c+",  "2025-12-09", None, "No bell after chapel"),
    ("c+",  "2025-12-16", None, "No bell after chapel"),
    ("c+",  "2026-01-06", None, "No bell after chapel"),
    ("c+",  "2026-01-13", None, "No bell after chapel"),
    ("c+",  "2026-01-20", None, "Chime to end chapel"),
    ("c+",  "2026-01-27", None, "Chime to end chapel"),
    ("c+",  "2026-02-03", None, "Chime to end chapel"),
    ("c+",  "2026-02-10", None, "Chime to end chapel"),
    ("c+",  "2026-02-17", None, "Longbell to end chapel"),
    ("c+",  "2026-02-24", None, "Longbell to end chapel"),
    ("c+",  "2026-03-03", None, "Longbell to end chapel"),
    ("c+",  "2026-03-10", None, "Longbell to end chapel"),
    ("c+",  "2026-03-17", None, "Longbell to end chapel"),
    ("c+",  "2026-03-24", None, "Longbell to end chapel"),
    ("c+",  "2026-03-31", None, "Longbell to end chapel"),
    ("c+",  "2026-04-21", None, "Longbell to end chapel"),
    ("c+",  "2026-04-28", None, "Longbell to end chapel"),
    ("c+",  "2026-05-05", None, "Longbell to end chapel"),
    ("c+",  "2026-05-12", None, "Longbell to end chapel"),
    ("c+",  "2026-05-19", None, "Longbell to end chapel"),

    # ── 2024/2025 ──────────────────────────────────────────────────────────
    ("X",   "2024-08-05", "2024-08-13", "(New) Teacher Orientation and Welcoming Students"),
    ("X",   "2024-09-12", "2024-09-20", "Flooding"),
    ("X",   "2024-10-11", None,         "In-service"),
    ("Z",   "2024-10-14", None,         "Thai holiday"),
    ("B",   "2024-10-17", None,         "Math Buddy classes"),
    ("L",   "2024-10-17", None,         "Late Start schedule"),
    ("L",   "2024-10-18", None,         "Late Start schedule"),
    ("Z",   "2024-10-23", None,         "Thai holiday"),
    ("e+",  "2024-10-28", None,         "No elementary"),
    ("Y+",  "2024-11-07", None,         "Start Youth Retreat after 10:00 am"),
    ("X",   "2024-11-08", None,         "Youth Retreat"),
    ("L",   "2024-11-15", None,         "Late Start schedule"),
    ("T+",  "2024-11-26", None,         "Thanksgiving (end school at 12:30)"),
    ("Z",   "2024-12-10", None,         "School closed"),
    ("L",   "2024-12-13", None,         "Late Start schedule"),
    ("s+",  "2025-01-08", None,         "Sports Day Meeting"),
    ("s+",  "2025-01-20", None,         "Sports Day Meeting"),
    ("X",   "2025-01-22", None,         "Sports Day"),
    ("Z",   "2025-02-07", "2025-02-10", "Family weekend"),
    ("L",   "2025-02-14", None,         "Late Start schedule"),
    ("I+",  "2025-02-20", None,         "International Day"),
    ("B",   "2025-02-21", None,         "SS Buddy Class"),
    ("L",   "2025-02-21", None,         "Late Start schedule"),
    ("X",   "2025-03-14", None,         "In-service"),
    ("L",   "2025-03-21", None,         "Late Start schedule"),
    ("t+",  "2025-04-04", None,         "Songkran celebration (No bell after 2:10 pm)"),
    ("t+",  "2025-05-02", None,         "Sister Act Jr."),
    ("Z",   "2025-05-05", None,         "School closed"),
    ("L",   "2025-05-09", None,         "Late Start schedule"),
    ("X",   "2025-05-23", None,         "Last Day of School Party"),
    ("X",   "2025-05-26", None,         "Teacher Work Day"),
    ("Z",   "2025-05-27", "2025-08-01", "Summer Break"),

    # ── 2023/2024 ──────────────────────────────────────────────────────────
    ("X",   "2023-08-07", "2023-08-15", "(New) Teacher Orientation and Welcoming Students"),
    ("S+",  "2023-08-16", "2023-08-18", "Elementary Finishes at 14:00"),
    ("#H+", "2023-08-31", None,         "Secondary Student Open House"),
    ("L",   "2023-09-01", None,         "Late Start"),
    ("E+",  "2023-09-13", "2023-09-15", "Youth Retreat: Only Elementary"),
    ("L",   "2023-10-06", None,         "Late Start"),
    ("Z",   "2023-10-13", None,         "Closed for Death of Rama IX"),
    ("B",   "2023-10-16", None,         "Math Buddy classes"),
    ("L",   "2023-10-16", None,         "Late Start"),
    ("X",   "2023-10-20", None,         "In-Service"),
    ("Z",   "2023-10-23", None,         "Closed"),
    ("e+",  "2023-11-06", None,         "No Elementary"),
    ("L",   "2023-11-10", None,         "Late Start"),
    ("Q+",  "2023-11-24", None,         "No Lunch bells"),
    ("P+",  "2023-11-24", None,         "Afternoon off"),
    ("Z",   "2023-12-05", None,         "Closed (Old Kings Birthday)"),
    ("E+",  "2023-12-07", None,         "Christmas Story (Elementary only)"),
    ("L",   "2023-12-08", None,         "Late Start"),
    ("Z",   "2023-12-11", None,         "Closed"),
    ("s+",  "2023-12-13", None,         "Sports Day meeting"),
    ("P+",  "2023-12-15", None,         "Christmas Program"),
    ("Z",   "2023-12-18", "2024-01-01", "Christmas Break"),
    ("X",   "2024-01-02", None,         "Work Day"),
    ("X",   "2024-01-08", None,         "In-Service"),
    ("q",   "2024-01-17", None,         "Sports Day"),
    ("t+",  "2024-01-24", None,         "Wai Kru Day"),
    ("Z",   "2024-02-02", None,         "Closed"),
    ("Z",   "2024-02-09", None,         "Closed"),
    ("Z",   "2024-02-12", None,         "Closed"),
    ("I+",  "2024-02-22", None,         "International Day"),
    ("L",   "2024-03-01", None,         "Late Start"),
    ("X",   "2024-03-15", None,         "In-Service"),
    ("t+",  "2024-04-03", None,         "Songkran Celebration"),
    ("Z",   "2024-04-04", "2024-04-17", "Songkran Break"),
    ("Z",   "2024-05-06", None,         "Closed"),
    ("L",   "2024-05-10", None,         "Late Start"),
    ("X",   "2024-05-24", None,         "Last Day of School"),
    ("X",   "2024-05-27", None,         "Teacher Work Day"),
    ("Z",   "2024-05-28", "2024-08-02", "Summer Break"),

    # ── 2022/2023 ──────────────────────────────────────────────────────────
    ("X",   "2022-08-15", None,         "Secondary Student Orientation"),
    ("X",   "2022-08-16", None,         "Elementary Open House"),
    ("L",   "2022-09-09", None,         "Late Start"),
    ("B",   "2022-09-26", None,         "Math Buddies + Late Start"),
    ("L",   "2022-10-07", None,         "Late Start"),
    ("E+",  "2022-10-12", None,         "Only Elementary"),
    ("Z",   "2022-10-13", None,         "School closed"),
    ("E+",  "2022-10-14", None,         "Only Elementary"),
    ("X",   "2022-10-21", None,         "In-service day"),
    ("L",   "2022-11-11", None,         "Late Start"),
    ("P+",  "2022-11-24", None,         "Thanksgiving"),
    ("Z",   "2022-12-05", None,         "Closed"),
    ("L",   "2022-12-09", None,         "Late Start"),
    ("Z",   "2022-12-12", None,         "Closed"),
    ("n+",  "2022-12-16", None,         "Noon bell instead of 12:20pm"),
    ("P+",  "2022-12-16", None,         "Afternoon no bells"),
    ("Z",   "2022-12-19", "2023-01-02", "Christmas Break"),
    ("X",   "2023-01-03", None,         "In-service day"),
    ("X",   "2023-01-18", None,         "Sports day"),
    ("L",   "2023-02-03", None,         "Late Start"),
    ("Z",   "2023-02-10", None,         "Closed"),
    ("Z",   "2023-02-13", None,         "Closed"),
    ("L",   "2023-03-10", None,         "Late Start"),
    ("t+",  "2023-03-31", None,         "School ends at 2:10 no Songkran celebration"),
    ("Z",   "2023-04-03", "2023-04-14", "Songkran Break"),
    ("Z",   "2023-05-04", None,         "Closed"),
    ("L",   "2023-05-12", None,         "Late Start"),
    ("t+",  "2023-05-12", None,         "Pennington farewell"),
    ("X",   "2023-05-26", None,         "Family Fun day"),
    ("X",   "2023-05-29", None,         "Teacher Work day"),
    ("Z",   "2023-05-30", "2023-08-04", "Summer Break"),

    # ── 2021/2022 ──────────────────────────────────────────────────────────
    ("#H",  "2021-09-02", None,         "Open House 2021"),
    ("L",   "2021-09-10", None,         "Late start"),
    ("X",   "2021-09-15", None,         "Youth Retreat"),
    ("L",   "2021-10-08", None,         "Late start"),
    ("Z",   "2021-10-13", None,         "Closed"),
    ("B",   "2021-10-21", None,         "Math buddies + Late Start"),
    ("X",   "2021-10-22", None,         "In-service day"),
    ("Z",   "2021-10-25", None,         "Closed"),
    ("C+",  "2021-11-01", None,         "Elementary Closed"),
    ("L",   "2021-11-12", None,         "Late start"),
    ("P+",  "2021-11-25", None,         "Afternoon off"),
    ("Z",   "2021-12-06", None,         "Closed"),
    ("Z",   "2021-12-07", "2021-12-09", "Covid closure"),
    ("Z",   "2021-12-10", None,         "Closed"),
    ("Z",   "2021-12-13", "2021-12-17", "Covid closure"),
    ("#t+", "2021-12-17", None,         "School ends at 14:00"),
    ("Z",   "2021-12-19", "2022-01-02", "Christmas Break"),
    ("X",   "2022-01-03", None,         "In-service day"),
    ("G+",  "2022-01-12", None,         "Game afternoon"),
    ("Z",   "2022-01-24", "2022-01-26", "Covid closure"),
    ("L",   "2022-02-04", None,         "Late start"),
    ("Z",   "2022-02-11", None,         "Closed"),
    ("Z",   "2022-02-14", None,         "Closed"),
    ("X",   "2022-02-24", None,         "International day"),
    ("L",   "2022-03-11", None,         "Late start"),
    ("X",   "2022-03-18", None,         "In-service day"),
    ("t+",  "2022-03-22", None,         "Science Fair 14:15"),
    ("t+",  "2022-04-01", None,         "Songkran celebration"),
    ("Z",   "2022-04-04", "2022-04-15", "Songkran Break"),
    ("Z",   "2022-05-02", None,         "Closed"),
    ("L",   "2022-05-13", None,         "Late start"),
    ("X",   "2022-05-27", None,         "Last Day of School"),
    ("X",   "2022-05-30", None,         "In-service day"),
    ("Z",   "2022-05-31", "2022-08-14", "Summer Break"),

    # ── 2020/2021 ──────────────────────────────────────────────────────────
    ("t+",  "2020-08-25", "2020-09-04", "Shorter days: Last bell at 14:10"),
    ("H+",  "2020-09-24", None,         "Open House 2020"),
    ("L",   "2020-09-25", None,         "Late start"),
    ("L",   "2020-10-16", None,         "Late start"),
    ("X",   "2020-10-22", None,         "In-service day"),
    ("Z",   "2020-10-23", None,         "Closed"),
    ("B",   "2020-10-28", None,         "Buddy classes"),
    ("L",   "2020-10-28", None,         "Late Start"),
    ("L",   "2020-11-06", None,         "Late Start"),
    ("p",   "2020-11-06", None,         "Electricity outage in the afternoon"),
    ("L",   "2020-11-20", None,         "Late start"),
    ("P+",  "2020-11-26", None,         "Thanksgiving no classes after lunch"),
    ("Z",   "2020-12-10", None,         "Closed"),
    ("Z",   "2020-12-11", None,         "Closed"),
    ("T+",  "2020-12-18", None,         "School ends at 14:00"),
    ("Z",   "2020-12-19", "2021-01-03", "Christmas break"),
    ("X",   "2021-01-04", None,         "In-service day"),
    ("L",   "2021-01-08", None,         "Late start"),
    ("X",   "2021-01-20", None,         "Sports Day"),
    ("I+",  "2021-02-11", None,         "International day"),
    ("Z",   "2021-02-12", None,         "Closed (Family weekend)"),
    ("Z",   "2021-02-15", None,         "Closed (Family weekend)"),
    ("L",   "2021-02-19", None,         "Late start"),
    ("L",   "2021-03-12", None,         "Late start"),
    ("X",   "2021-03-19", None,         "In-service day"),
    ("Z",   "2021-04-05", "2021-04-16", "Songkran break"),
    ("Z",   "2021-04-19", "2021-04-23", "Extended spring break"),
    ("Z",   "2021-04-26", "2021-05-27", "Home-based learning"),
    ("X",   "2021-05-28", None,         "Last Day of school"),
    ("Z",   "2021-05-31", "2021-08-17", "Summer break"),
    ("X",   "2021-07-19", "2021-07-30", "Summer camp"),

    # ── 2019/2020 ──────────────────────────────────────────────────────────
    ("Z",   "2019-08-20", None,         ""),
    ("L",   "2019-09-06", None,         "Late start"),
    ("H+",  "2019-09-19", None,         "Open House"),
    ("S+",  "2019-10-02", None,         "Prolonged lunch: mute 12:40 + 12:45"),
    ("L",   "2019-10-04", None,         "Late start"),
    ("Z",   "2019-10-14", None,         ""),
    ("X",   "2019-10-15", None,         "In-service day"),
    ("Z",   "2019-10-23", None,         ""),
    ("B",   "2019-10-31", None,         "Extra 7:55 and 8 am bell"),
    ("L",   "2019-10-31", None,         "Late Start"),
    ("L",   "2019-11-22", None,         "Late start"),
    ("Z",   "2019-11-26", None,         "Pole-moving (no power)"),
    ("Z",   "2019-12-05", None,         ""),
    ("Z",   "2019-12-10", None,         ""),
    ("l+",  "2019-12-18", None,         "Shortened lunch, extra bell at 12:20"),
    ("Z",   "2019-12-23", "2020-01-06", "Christmas break"),
    ("L",   "2020-01-10", None,         "Late start"),
    ("m",   "2020-01-10", None,         "Late start shortened lunch, no extra bell at 12:45"),
    ("l+",  "2020-01-14", None,         "Shortened lunch, extra bell at 12:20"),
    ("X",   "2020-01-15", None,         "Sports day"),
    ("X",   "2020-01-16", None,         "In-service day"),
    ("Z",   "2020-02-14", None,         ""),
    ("Z",   "2020-02-17", None,         ""),
    ("L",   "2020-02-21", None,         "Late start"),
    ("L",   "2020-03-13", None,         "Late start"),
    ("Z",   "2020-03-18", "2020-06-01", "Covid-19 break + School-at-home Q4"),
    ("#X",  "2020-03-23", "2020-08-24", "In-service day cancelled"),
    ("#L",  "2020-05-01", None,         "Late start irrelevant"),
    ("#X",  "2020-06-01", None,         "In-service day cancelled"),
    ("Z",   "2020-06-01", "2020-08-26", "Summer break"),
]


# ============================================================================
# SEED
# ============================================================================

def seed():
    conn = get_db()
    cur  = conn.cursor()

    print("🌱 Inserting schedules...")
    for sch in SCHEDULES:
        cur.execute("""
            INSERT INTO schedules (id, code, name, color, is_addon, is_normal, bell_slot, times)
            VALUES (%s, %s, %s, %s, %s, FALSE, %s, %s)
            ON CONFLICT (code) DO UPDATE SET
                name      = EXCLUDED.name,
                color     = EXCLUDED.color,
                is_addon  = EXCLUDED.is_addon,
                bell_slot = EXCLUDED.bell_slot,
                times     = EXCLUDED.times
        """, (
            sch["id"], sch["code"], sch["name"], sch["color"],
            sch["is_addon"], sch["bell_slot"], json.dumps(sch["times"])
        ))
    conn.commit()
    print(f"  ✅ {len(SCHEDULES)} schedules done")

    print("🌱 Inserting table rows...")
    cur.execute("DELETE FROM table_rows")
    for i, (code, from_d, to_d, comment) in enumerate(TABLE_ROWS):
        cur.execute("""
            INSERT INTO table_rows (id, code, from_date, to_date, comment)
            VALUES (%s, %s, %s, %s, %s)
        """, (str(1000000 + i), code, from_d, to_d, comment))
    conn.commit()
    print(f"  ✅ {len(TABLE_ROWS)} rows done")

    cur.close()
    conn.close()
    print("🎉 All done!")


if __name__ == "__main__":
    seed()