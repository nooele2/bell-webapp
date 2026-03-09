import { useState, useEffect } from 'react';
import { Save, Check, Play, Pause, ArrowLeft } from 'lucide-react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { C } from '../constants/theme';

const GITHUB_API_URL   = 'https://api.github.com/repos/pepa65/piring/contents/soundfiles';
const AUDIO_EXTENSIONS = ['.wav', '.mp3', '.ogg', '.flac'];
const API_BASE_URL     = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://localhost:5001/api';
const SLOTS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export default function RingtoneSetup({ onBack }) {
  const [sounds, setSounds]         = useState([]);
  const [mappings, setMappings]     = useState(Object.fromEntries(SLOTS.map(s => [String(s), null])));
  const [loadingSounds, setLoading] = useState(true);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const { playingId, togglePlay }   = useAudioPlayer();

  useEffect(() => { loadSounds(); loadMappings(); }, []);

  const loadSounds = async () => {
    try {
      const res   = await fetch(GITHUB_API_URL);
      const files = await res.json();
      setSounds(
        files
          .filter(f => AUDIO_EXTENSIONS.some(ext => f.name.toLowerCase().endsWith(ext)))
          .map(f => ({ filename: f.name, name: f.name.replace(/\.[^/.]+$/, '') }))
      );
    } catch (err) { console.error('Failed to load sounds:', err); }
    finally { setLoading(false); }
  };

  const loadMappings = async () => {
    try {
      const res  = await fetch(`${API_BASE_URL}/ringtone-mappings`, { credentials: 'include' });
      const data = await res.json();
      setMappings(prev => ({ ...prev, ...data }));
    } catch (err) { console.error('Failed to load mappings:', err); }
  };

  const handleSelect = (slot, filename) => {
    setMappings(prev => ({ ...prev, [String(slot)]: filename || null }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ringtone-mappings`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mappings),
      });
      if (!res.ok) throw new Error('Failed');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { alert('Failed to save ringtone mappings'); }
    finally { setSaving(false); }
  };

  const assignedSlots = SLOTS.filter(s => mappings[String(s)]);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>

      {/* Page title row — matches the style of other view titles */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <button onClick={onBack}
            style={{ background:C.offwhite, border:`1px solid ${C.border}`, borderRadius:'8px', padding:'8px 14px', cursor:'pointer', color:C.textMuted, fontWeight:600, fontSize:'13px', display:'flex', alignItems:'center', gap:'6px' }}>
            <ArrowLeft size={14}/> Back
          </button>
          <div>
            <div style={{ fontSize:'20px', fontWeight:800, color:C.navy }}>Bell Sounds</div>
            <div style={{ fontSize:'13px', color:C.textMuted, marginTop:'2px' }}>Assign a sound file to each slot number</div>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving}
          style={{ background:saved ? '#16a34a' : C.red, color:C.white, border:'none', borderRadius:'8px', padding:'9px 22px', cursor:'pointer', fontSize:'14px', fontWeight:700, display:'flex', alignItems:'center', gap:'7px', opacity:saving ? 0.75 : 1, transition:'background 0.2s' }}>
          {saved ? <><Check size={15}/> Saved</> : saving ? 'Saving…' : <><Save size={14}/> Save</>}
        </button>
      </div>

      {/* Info banner */}
      <div style={{ background:'#eef3fc', border:`1px solid ${C.navyLight}40`, borderRadius:'12px', padding:'13px 18px', fontSize:'13px', color:C.navy, lineHeight:1.7 }}>
        <strong>How slots work:</strong> Each slot (0–9) maps to a sound file on the Pi.
        Slot 0 is the default — used by most bells unless a schedule specifies otherwise.
        Slot 8 is typically the chapel long-bell. Pick a sound for each slot you use, then press Save.
      </div>

      {/* Slot list */}
      <div style={{ background:C.white, borderRadius:'14px', border:`1px solid ${C.border}`, overflow:'hidden' }}>
        <div style={{ height:'3px', background:`linear-gradient(90deg,${C.navy},${C.red})` }}/>

        {SLOTS.map((slot, i) => {
          const selectedFilename = mappings[String(slot)];
          const isPlaying        = playingId === selectedFilename;
          const isDefault        = slot === 0;

          return (
            <div key={slot}
              style={{ display:'grid', gridTemplateColumns:'52px 1fr 42px', gap:'14px', alignItems:'center', padding:'13px 24px', borderBottom:i < SLOTS.length - 1 ? `1px solid ${C.border}` : 'none', background:isDefault ? '#f8faff' : C.white }}>

              {/* Slot badge */}
              <div style={{ width:'44px', height:'44px', borderRadius:'10px', background:isDefault ? C.navy : C.offwhite, border:isDefault ? 'none' : `1px solid ${C.border}`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ fontSize:'18px', fontWeight:800, color:isDefault ? C.white : C.text, lineHeight:1 }}>{slot}</span>
                {isDefault && <span style={{ fontSize:'8px', color:'rgba(255,255,255,0.65)', fontWeight:700, marginTop:'1px', letterSpacing:'0.04em' }}>DEFAULT</span>}
              </div>

              {/* Dropdown */}
              {loadingSounds ? (
                <div style={{ height:'38px', background:C.offwhite, borderRadius:'8px' }}/>
              ) : (
                <select
                  value={selectedFilename || ''}
                  onChange={e => handleSelect(slot, e.target.value)}
                  style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${selectedFilename ? C.navyLight + '60' : C.border}`, borderRadius:'8px', fontSize:'13px', background:C.white, color:selectedFilename ? C.text : C.textLight, outline:'none', cursor:'pointer' }}>
                  <option value="">— No sound assigned —</option>
                  {sounds.map(s => (
                    <option key={s.filename} value={s.filename}>{s.name}</option>
                  ))}
                </select>
              )}

              {/* Preview */}
              {selectedFilename ? (
                <button onClick={() => togglePlay(selectedFilename)}
                  style={{ width:'38px', height:'38px', borderRadius:'50%', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', background:isPlaying ? C.navy : C.offwhite, color:isPlaying ? C.white : C.textMuted, flexShrink:0, transition:'all 0.15s' }}>
                  {isPlaying ? <Pause size={15}/> : <Play size={15} style={{ marginLeft:'2px' }}/>}
                </button>
              ) : <div/>}
            </div>
          );
        })}
      </div>

      {/* Pi softlink reference — only when slots are assigned */}
      {assignedSlots.length > 0 && (
        <div style={{ background:C.white, borderRadius:'14px', border:`1px solid ${C.border}`, overflow:'hidden' }}>
          <div style={{ height:'3px', background:`linear-gradient(90deg,${C.navy},${C.red})` }}/>
          <div style={{ padding:'14px 24px', borderBottom:`1px solid ${C.border}` }}>
            <div style={{ fontSize:'14px', fontWeight:800, color:C.navy }}>Pi Softlink Commands</div>
            <div style={{ fontSize:'12px', color:C.textMuted, marginTop:'2px' }}>Run these on the Pi to connect each slot to its sound file</div>
          </div>
          <div style={{ padding:'14px 24px', display:'flex', flexDirection:'column', gap:'8px' }}>
            {assignedSlots.map(slot => (
              <div key={slot} style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                <div style={{ width:'26px', height:'26px', borderRadius:'6px', background:slot === 0 ? C.navy : C.offwhite, border:slot === 0 ? 'none' : `1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ fontSize:'12px', fontWeight:800, color:slot === 0 ? C.white : C.text }}>{slot}</span>
                </div>
                <code style={{ fontSize:'13px', fontFamily:'monospace', color:C.text, background:C.offwhite, padding:'5px 12px', borderRadius:'7px', border:`1px solid ${C.border}` }}>
                  ln -s {mappings[String(slot)]} {slot}.ring
                </code>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}