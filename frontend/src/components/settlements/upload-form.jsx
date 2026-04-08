import { useState, useRef } from 'react';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../utils/api';
import Button from '../common/Button';

const UploadForm = ({ onUploadSuccess }) => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError(null);
            setSuccess(null);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;

        setLoading(true);
        setError(null);
        setSuccess(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/settlements/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setSuccess(response.message || 'Upload successful!');
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            if (onUploadSuccess) onUploadSuccess(response.summary);
        } catch (err) {
            setError(err.message || 'Failed to upload settlement file');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', width: '100%' }}>
            <form onSubmit={handleUpload}>
                <div style={{
                    border: '2px dashed var(--panel-border)',
                    borderRadius: '0.75rem',
                    padding: '2rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: 'rgba(255,255,255,0.02)',
                }} onClick={() => fileInputRef.current.click()}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        accept=".csv,.json"
                    />
                    <Upload size={32} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
                    {file ? (
                        <div>
                            <p style={{ fontWeight: '500' }}>{file.name}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(2)} KB</p>
                        </div>
                    ) : (
                        <div>
                            <p style={{ fontWeight: '500' }}>Click or drag settlement file here</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Supports CSV and JSON (Max 1,000 rows)</p>
                        </div>
                    )}
                </div>

                {error && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', fontSize: '0.875rem', marginTop: '1rem' }}>
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                {success && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontSize: '0.875rem', marginTop: '1rem' }}>
                        <CheckCircle size={16} />
                        {success}
                    </div>
                )}

                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        variant="primary"
                        type="submit"
                        disabled={!file || loading}
                        style={{ minWidth: '120px' }}
                    >
                        {loading ? 'Uploading...' : 'Upload Batch'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default UploadForm;
