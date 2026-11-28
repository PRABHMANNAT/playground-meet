'use client';
import { useId, useState } from 'react';
import { ChevronDown, UserRound } from 'lucide-react';
import { avatarCollections, meetingAvatarSrc, type MeetingAvatar } from '@/lib/meeting-avatars';

export function PrejoinAvatarPicker({
  avatar,
  onChange,
  disabled,
}: {
  avatar?: MeetingAvatar;
  onChange: (avatar?: MeetingAvatar) => void;
  disabled: boolean;
}) {
  const group = useId();
  const [collectionIndex, setCollectionIndex] = useState(() =>
    Math.max(
      0,
      avatarCollections.findIndex(({ options }) => options.some((option) => option.id === avatar)),
    ),
  );
  const choices = avatarCollections[collectionIndex].options;

  return (
    <details className="prejoin-avatar-picker">
      <summary>
        {avatar ? <img src={meetingAvatarSrc(avatar)} alt="" /> : <UserRound size={18} />}
        <span>{avatar ? 'Change avatar' : 'Choose an avatar (optional)'}</span>
        <ChevronDown className="avatar-picker-chevron" size={16} />
      </summary>
      <fieldset disabled={disabled} aria-label="Meeting avatar">
        <select
          aria-label="Avatar collection"
          value={collectionIndex}
          onChange={(e) => setCollectionIndex(Number(e.target.value))}
        >
          {avatarCollections.map(({ id, label }, index) => (
            <option key={id} value={index}>
              {label}
            </option>
          ))}
        </select>
        <div className="prejoin-avatar-options">
          <label title="Default avatar">
            <input
              type="radio"
              name={group}
              checked={!avatar}
              aria-label="Default avatar"
              onChange={() => onChange()}
            />
            <span>
              <UserRound size={19} /> Default
            </span>
          </label>
          {choices.map(({ id, label }) => (
            <label key={id} title={label}>
              <input
                type="radio"
                name={group}
                checked={avatar === id}
                aria-label={label}
                onChange={() => onChange(id)}
              />
              <span>
                <img src={meetingAvatarSrc(id)} alt="" width={48} height={48} loading="lazy" />
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </details>
  );
}
