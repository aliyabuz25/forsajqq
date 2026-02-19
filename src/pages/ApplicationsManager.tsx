import React, { useState, useEffect } from 'react';
import { Inbox, CheckCircle, Clock, Trash2, User, Phone, FileText, ChevronRight, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import './ApplicationsManager.css';

interface Application {
    id: number;
    name: string;
    contact: string;
    type: string;
    content: string;
    status: 'unread' | 'read';
    created_at: string;
}

const ApplicationsManager: React.FC = () => {
    const [applications, setApplications] = useState<Application[]>([]);
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

    const fetchApplications = async () => {
        const token = localStorage.getItem('forsaj_admin_token');
        try {
            const res = await fetch('/api/applications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setApplications(data);
            }
        } catch (err) {
            toast.error('Müraciətlər yüklənərkən xəta baş verdi');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    const markAsRead = async (id: number) => {
        const token = localStorage.getItem('forsaj_admin_token');
        try {
            const res = await fetch(`/api/applications/${id}/read`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setApplications(prev => prev.map(app => app.id === id ? { ...app, status: 'read' } : app));
                if (selectedApp?.id === id) {
                    setSelectedApp(prev => prev ? { ...prev, status: 'read' } : null);
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    const deleteApplication = async (id: number) => {
        if (!window.confirm('Bu müraciəti silmək istədiyinizə əminsiniz?')) return;

        const token = localStorage.getItem('forsaj_admin_token');
        try {
            const res = await fetch(`/api/applications/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setApplications(prev => prev.filter(app => app.id !== id));
                if (selectedApp?.id === id) setSelectedApp(null);
                toast.success('Müraciət silindi');
            }
        } catch (err) {
            toast.error('Silinmə zamanı xəta baş verdi');
        }
    };

    const filteredApps = applications.filter(app => {
        if (filter === 'unread') return app.status === 'unread';
        if (filter === 'read') return app.status === 'read';
        return true;
    });

    const parseContentForExport = (rawContent: string) => {
        const text = String(rawContent || '').trim();
        if (!text) return { contentText: '', parsedFields: {} as Record<string, string> };

        try {
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed)) {
                return {
                    contentText: parsed.map((item) => String(item ?? '')).join(' | '),
                    parsedFields: { content_json: JSON.stringify(parsed) }
                };
            }
            if (parsed && typeof parsed === 'object') {
                const parsedFields: Record<string, string> = {};
                for (const [key, value] of Object.entries(parsed)) {
                    parsedFields[`content_${String(key).trim()}`] = String(value ?? '');
                }
                return {
                    contentText: Object.entries(parsed).map(([key, value]) => `${key}: ${String(value ?? '')}`).join(' | '),
                    parsedFields
                };
            }

            return { contentText: String(parsed), parsedFields: {} as Record<string, string> };
        } catch {
            return { contentText: text, parsedFields: {} as Record<string, string> };
        }
    };

    const exportToXlsx = async () => {
        if (!filteredApps.length) {
            toast.error('Export üçün müraciət tapılmadı');
            return;
        }

        try {
            const XLSX = await import('xlsx');
            const rows = filteredApps.map((app) => {
                const { contentText, parsedFields } = parseContentForExport(app.content);
                return {
                    id: app.id,
                    status: app.status,
                    name: app.name,
                    contact: app.contact,
                    type: app.type,
                    created_at: app.created_at,
                    content: contentText,
                    ...parsedFields
                };
            });

            const headers = Array.from(rows.reduce((acc, row) => {
                Object.keys(row).forEach((key) => acc.add(key));
                return acc;
            }, new Set<string>()));

            const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Applications');
            const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
            XLSX.writeFile(workbook, `applications-${filter}-${stamp}.xlsx`);
            toast.success('XLSX faylı yükləndi');
        } catch (error) {
            console.error(error);
            toast.error('XLSX export zamanı xəta baş verdi');
        }
    };

    const renderContent = (content: string) => {
        try {
            const data = JSON.parse(content);
            return (
                <div className="app-details-grid">
                    {Object.entries(data).map(([key, value]) => (
                        <div key={key} className="detail-item">
                            <span className="detail-label">{key.toUpperCase()}:</span>
                            <span className="detail-value">{String(value)}</span>
                        </div>
                    ))}
                </div>
            );
        } catch {
            return <div className="detail-text">{content}</div>;
        }
    };

    if (isLoading) return <div className="loading-state">Yüklənir...</div>;

    return (
        <div className="applications-manager fade-in">
            <div className="manager-header">
                <div>
                    <h1>Müraciətlər</h1>
                    <p>İstifadəçilər tərəfindən göndərilən formlar və qeydiyyatlar</p>
                </div>
                <div className="filter-tabs">
                    <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Hamısı</button>
                    <button className={filter === 'unread' ? 'active' : ''} onClick={() => setFilter('unread')}>Oxunmamış</button>
                    <button className={filter === 'read' ? 'active' : ''} onClick={() => setFilter('read')}>Oxunmuş</button>
                </div>
                <button className="btn-export" onClick={exportToXlsx}>
                    <Download size={16} />
                    XLSX Export
                </button>
            </div>

            <div className="manager-body">
                <div className="applications-list">
                    {filteredApps.length === 0 ? (
                        <div className="empty-list">Heç bir müraciət tapılmadı</div>
                    ) : (
                        filteredApps.map(app => (
                            <div
                                key={app.id}
                                className={`application-item ${app.status} ${selectedApp?.id === app.id ? 'selected' : ''}`}
                                onClick={() => {
                                    setSelectedApp(app);
                                    if (app.status === 'unread') markAsRead(app.id);
                                }}
                            >
                                <div className="app-item-icon">
                                    {app.status === 'unread' ? <Clock className="icon-unread" /> : <CheckCircle className="icon-read" />}
                                </div>
                                <div className="app-item-main">
                                    <div className="app-item-header">
                                        <span className="app-item-name">{app.name}</span>
                                        <span className="app-item-date">{new Date(app.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="app-item-type">{app.type}</div>
                                </div>
                                <ChevronRight size={16} className="chevron" />
                            </div>
                        ))
                    )}
                </div>

                <div className="application-details">
                    {selectedApp ? (
                        <div className="details-card fade-in">
                            <div className="details-header">
                                <div>
                                    <h2>Müraciət Təfərrüatları</h2>
                                    <span className={`status-badge ${selectedApp.status}`}>{selectedApp.status === 'unread' ? 'Yeni' : 'Oxunub'}</span>
                                </div>
                                <div className="header-actions">
                                    <button className="btn-delete" onClick={() => deleteApplication(selectedApp.id)}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="details-info">
                                <div className="info-group">
                                    <label><User size={16} /> Göndərən</label>
                                    <p>{selectedApp.name}</p>
                                </div>
                                <div className="info-group">
                                    <label><Phone size={16} /> Əlaqə</label>
                                    <p>{selectedApp.contact}</p>
                                </div>
                                <div className="info-group">
                                    <label><FileText size={16} /> Kateqoriya</label>
                                    <p>{selectedApp.type}</p>
                                </div>
                            </div>

                            <div className="details-content">
                                <label>Məzmun</label>
                                <div className="content-box">
                                    {renderContent(selectedApp.content)}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="details-placeholder">
                            <Inbox size={48} />
                            <p>Baxmaq üçün siyahıdan müraciət seçin</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ApplicationsManager;
