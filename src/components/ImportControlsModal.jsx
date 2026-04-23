import React, { useEffect, useState } from 'react';
import Icon from './common/Icon';
import { showSuccessToast, showErrorToast } from '../utils/toast';

const MAX_BYTES = 20 * 1024 * 1024;

function downloadCsvTemplate() {
  const header = 'Control ID,Description,Owner,Escalation';
  const example = 'VGCP-EXAMPLE,Example control description,Jane Doe,Yes';
  const csv = `${header}\n${example}\n`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'controls_import_template.csv';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function ImportControlsModal({ isOpen, onClose, onImportSubmit }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setFile(null);
    setError('');
    setSubmitting(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function validateAndSetFile(selected) {
    setError('');
    if (!selected) {
      setFile(null);
      return;
    }
    const name = selected.name.toLowerCase();
    if (!name.endsWith('.csv')) {
      setError('Please select a CSV file.');
      setFile(null);
      return;
    }
    if (selected.size > MAX_BYTES) {
      setError('File must be 20 MB or smaller.');
      setFile(null);
      return;
    }
    setFile(selected);
  }

  function onFileChange(e) {
    validateAndSetFile(e.target.files?.[0] ?? null);
  }

  async function handleImport() {
    if (!file) {
      setError('Please select a file to import.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      if (onImportSubmit) {
        await onImportSubmit(file);
      }

      showSuccessToast({
        title: 'Import submitted',
        message: onImportSubmit
          ? `${file.name} was imported successfully.`
          : `${file.name} passed validation.`,
      });

      onClose?.();
    } catch (e) {
      const msg = e?.message || 'Import failed';
      setError(msg);
      showErrorToast({
        title: 'Import failed',
        message: msg,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className="modal icm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-controls-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title" id="import-controls-title">
            Import Controls
          </h2>

          <button type="button" className="modal-x" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="icm-body">
          <div className="icm-requirements">
            <div className="icm-requirements__icon" aria-hidden="true">
              <Icon name="exclamation" category="deco" size="md" color="#1e40af" />
            </div>
            <div>
              <p className="icm-requirements__title">File Requirements</p>
              <ul className="icm-requirements__text icm-requirements__list">
                <li>
                  Accepted formats: <strong>CSV</strong>
                </li>
                <li>Required columns: Control ID, Description, Owner, Escalation</li>
                <li>Maximum file size: 20 MB</li>
              </ul>
            </div>
          </div>

          {error ? <div className="icm-error">{error}</div> : null}

          <div className="icm-field">
            <label className="icm-field-label" htmlFor="import-controls-file">
              Select File to Import
            </label>
            <input
              id="import-controls-file"
              className="icm-file-input"
              type="file"
              accept=".csv,text/csv"
              onChange={onFileChange}
              disabled={submitting}
            />
            <p className="icm-field-hint">Upload a CSV file containing control data</p>
          </div>

          <div className="icm-template">
            <div className="icm-template__left">
              <Icon name="documents" category="deco" size="md" color="#8b0f17" />
              <span className="icm-template__label">Need a template?</span>
            </div>
            <button
              type="button"
              className="icm-template__download"
              onClick={downloadCsvTemplate}
              disabled={submitting}
            >
              <Icon name="download" category="actions" size="sm" color="#8b0f17" />
              Download CSV Template
            </button>
          </div>
        </div>

        <div className="icm-footer">
          <button type="button" className="icm-btn-cancel" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            type="button"
            className="icm-btn-import"
            onClick={handleImport}
            disabled={submitting || !file}
          >
            <Icon name="upload" category="actions" size="sm" color="#ffffff" />
            Import Controls
          </button>
        </div>
      </div>
    </div>
  );
}
