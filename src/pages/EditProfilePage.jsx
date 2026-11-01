import { useState } from 'react'
import { ArrowLeft, Save, Camera, Check, Shield, User, Phone, Mail, FileText } from 'lucide-react'
import userService from '../services/userService'

export default function EditProfilePage({ onBack, onSuccess }) {
  const [profile, setProfile] = useState(() => userService.getUserProfile())
  const [username, setUsername] = useState(profile.username || 'Shooter')
  const [bio, setBio] = useState(profile.bio || '')
  const [phone, setPhone] = useState(profile.phone || '081367936664')
  const [email, setEmail] = useState(profile.email || 'operator@borebarrel.io')
  const [avatar, setAvatar] = useState(profile.avatar || null)
  const [feedback, setFeedback] = useState('')
  const [saving, setSaving] = useState(false)

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setFeedback('Avatar image must be under 2MB.')
      setTimeout(() => setFeedback(''), 3000)
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target.result
      setAvatar(base64)
      userService.updateAvatar(base64)
      setFeedback('Avatar preview updated.')
      setTimeout(() => setFeedback(''), 3000)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = (e) => {
    e.preventDefault()
    setSaving(true)

    const updated = {
      ...profile,
      username: username.trim() || 'Shooter',
      bio: bio.trim(),
      phone: phone.trim(),
      email: email.trim(),
      avatar,
    }

    const result = userService.saveUserProfile(updated)
    setSaving(false)

    if (result.success) {
      setProfile(result.data)
      setFeedback('Profile successfully updated!')
      setTimeout(() => {
        if (onSuccess) onSuccess()
        else if (onBack) onBack()
      }, 800)
    } else {
      setFeedback('Failed to save profile changes.')
    }
  }

  return (
    <div className="edit-profile-page">
      <div className="page-head">
        <button type="button" className="detail-back" onClick={onBack}>
          <ArrowLeft size={18} /> Back to Profile
        </button>
        <h1 className="display">Edit Operator Profile</h1>
        <p className="lede">
          Configure your armorer credentials, contact details, and station telemetry.
        </p>
      </div>

      {feedback && (
        <div className="toast toast--success">
          <Check size={18} /> {feedback}
        </div>
      )}

      <form onSubmit={handleSave} className="profile-edit-form-card">
        {/* Avatar Section */}
        <div className="avatar-edit-section">
          <div className="avatar-wrap large">
            {avatar ? (
              <img src={avatar} alt={username} className="avatar-img" />
            ) : (
              <div className="avatar-placeholder">
                <Shield size={48} stroke="var(--brass)" />
              </div>
            )}
            <label htmlFor="avatar-upload-input" className="avatar-upload-btn" title="Change photo">
              <Camera size={16} />
              <input
                id="avatar-upload-input"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden-file-input"
              />
            </label>
          </div>
          <div className="avatar-edit-help">
            <h3>Operator Portrait</h3>
            <p>Upload a square photo or emblem (JPG, PNG under 2MB).</p>
          </div>
        </div>

        {/* Fields */}
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="edit-username">
              <User size={15} /> Callsign / Alias
            </label>
            <input
              id="edit-username"
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. Operator Alpha"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-phone">
              <Phone size={15} /> WhatsApp / Phone Number
            </label>
            <input
              id="edit-phone"
              type="tel"
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="081367936664"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-email">
              <Mail size={15} /> Armory Dispatch Email
            </label>
            <input
              id="edit-email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@borebarrel.io"
            />
          </div>

          <div className="form-group full-width">
            <label className="form-label" htmlFor="edit-bio">
              <FileText size={15} /> Armorer Bio &amp; Station Notes
            </label>
            <textarea
              id="edit-bio"
              className="form-textarea"
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Unit assignment, certifications, specialized calibers..."
            />
          </div>
        </div>

        <div className="form-actions-bar">
          <button type="button" className="btn btn--outline" onClick={onBack}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            <Save size={16} /> {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
