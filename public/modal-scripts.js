// Modal Management for Admin Dashboard

// Status Modal Functions
function openStatusModal(reportId) {
    currentReportId = parseInt(reportId); // Convert to number
    const report = allReports.find(r => r.id === currentReportId);
    if (report) {
        document.getElementById('new-status').value = report.status || 'Pending';
    }
    document.getElementById('status-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('status-modal').style.display = 'none';
    currentReportId = null;
}

async function updateStatus() {
    if (!currentReportId) return;

    const newStatus = document.getElementById('new-status').value;
    
    try {
        const response = await fetch(`/api/reports/${currentReportId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            closeModal();
            loadReports(); // Refresh the table
            alert('Status updated successfully!');
        } else {
            alert('Error updating status. Please try again.');
        }
    } catch (error) {
        console.error('Error updating status:', error);
        alert('Error updating status. Please try again.');
    }
}

// Details Modal Functions
function viewDetails(reportId) {
    console.log('viewDetails called with reportId:', reportId, 'type:', typeof reportId);
    console.log('currentReports:', currentReports);
    
    try {
        if (!currentReports || currentReports.length === 0) {
            alert('No reports data available. Please refresh the page.');
            return;
        }
        
        // Convert reportId to number to match database ID type
        const numericReportId = parseInt(reportId);
        console.log('Looking for numeric ID:', numericReportId);
        
        const report = currentReports.find(r => r.id === numericReportId);
        console.log('Found report:', report);
        
        if (!report) {
            alert(`Report with ID ${numericReportId} not found.`);
            return;
        }
        
        const submittedBy = report.users ? 
            (report.users.name || `Facebook User (${report.users.fb_id})`) : 
            'Unknown User';
        
        const detailsHtml = `
            <!-- Report Header -->
            <div style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 1.5rem;
                border-radius: 12px;
                margin-bottom: 1.5rem;
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <h3 style="margin: 0; font-family: 'Figtree', sans-serif; font-weight: 700; font-size: 1.4rem;color: #fff;">
                        Report #${report.id}
                    </h3>
                    <span class="status-badge status-${(report.status || 'pending').toLowerCase().replace(' ', '-')}" 
                          style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3);">
                        ${report.status || 'Pending'}
                    </span>
                </div>
                <p style="margin: 0; opacity: 0.9; font-size: 0.95rem; font-family: 'Figtree', sans-serif;">
                    Submitted on ${new Date(report.created_at).toLocaleDateString('en-US', { 
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', 
                        hour: '2-digit', minute: '2-digit'
                    })}
                </p>
            </div>
            
            <!-- Report Information Grid -->
            <div style="
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 1rem;
                margin-bottom: 1.5rem;
            ">
                <div style="
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 1rem;
                    transition: all 0.2s ease;
                ">
                    <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                        <span style="font-size: 1.2rem; margin-right: 0.5rem;">👤</span>
                        <strong style="color: #2d3748; font-family: 'Figtree', sans-serif;">Reported by</strong>
                    </div>
                    <p style="margin: 0; color: #4a5568; font-family: 'Figtree', sans-serif;">${submittedBy}</p>
                </div>
                
                <div style="
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 1rem;
                ">
                    <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                        <span style="font-size: 1.2rem; margin-right: 0.5rem;">📂</span>
                        <strong style="color: #2d3748; font-family: 'Figtree', sans-serif;">Category</strong>
                    </div>
                    <span class="category-badge" style="
                        display: inline-block;
                        background: #e6fffa;
                        color: #047857;
                        padding: 0.25rem 0.75rem;
                        border-radius: 20px;
                        font-size: 0.85rem;
                        font-weight: 600;
                        font-family: 'Figtree', sans-serif;
                    ">${report.category || 'N/A'}</span>
                </div>
                
                <div style="
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 1rem;
                    grid-column: 1 / -1;
                ">
                    <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                        <span style="font-size: 1.2rem; margin-right: 0.5rem;">📍</span>
                        <strong style="color: #2d3748; font-family: 'Figtree', sans-serif;">Location</strong>
                    </div>
                    <p style="margin: 0; color: #4a5568; font-family: 'Figtree', sans-serif; font-size: 1rem;">
                        ${report.location || 'Location not specified'}
                    </p>
                </div>
            </div>
            
            <!-- Description Section -->
            <div style="margin-bottom: 1.5rem;">
                <div style="display: flex; align-items: center; margin-bottom: 1rem;">
                    <span style="font-size: 1.3rem; margin-right: 0.5rem;">📝</span>
                    <h4 style="margin: 0; color: #2d3748; font-family: 'Figtree', sans-serif; font-weight: 600;">
                        Incident Description
                    </h4>
                </div>
                <div style="
                    background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
                    padding: 1.25rem;
                    border-radius: 12px;
                    border-left: 4px solid #667eea;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                    position: relative;
                ">
                    <div style="
                        position: absolute;
                        top: 0.75rem;
                        right: 0.75rem;
                        width: 6px;
                        height: 6px;
                        background: #667eea;
                        border-radius: 50%;
                        opacity: 0.3;
                    "></div>
                    <p style="
                        margin: 0;
                        color: #2d3748;
                        line-height: 1.6;
                        font-family: 'Figtree', sans-serif;
                        font-size: 0.95rem;
                    ">
                        ${report.description || '<em style="color: #a0aec0;">No description provided</em>'}
                    </p>
                </div>
            </div>
            
            <!-- Photo Section -->
            ${report.image_url ? `
            <div style="margin-bottom: 1rem;">
                <div style="display: flex; align-items: center; margin-bottom: 1rem;">
                    <span style="font-size: 1.3rem; margin-right: 0.5rem;">📸</span>
                    <h4 style="margin: 0; color: #2d3748; font-family: 'Figtree', sans-serif; font-weight: 600;">
                        Incident Photo
                    </h4>
                </div>
                <div style="
                    background: #f8fafc;
                    border: 2px dashed #cbd5e0;
                    border-radius: 12px;
                    padding: 1rem;
                    text-align: center;
                    transition: all 0.3s ease;
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;
                " onclick="viewImage('${report.image_url}')" onmouseover="this.style.borderColor='#667eea'; this.style.background='#f0f4ff'" onmouseout="this.style.borderColor='#cbd5e0'; this.style.background='#f8fafc'">
                    <img src="${report.image_url}" 
                         alt="Incident Photo" 
                         style="
                            max-width: 100%;
                            max-height: 300px;
                            border-radius: 8px;
                            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                            transition: transform 0.3s ease;
                         "
                         onmouseover="this.style.transform='scale(1.02)'"
                         onmouseout="this.style.transform='scale(1)'">
                    <div style="
                        margin-top: 0.75rem;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #667eea;
                        font-family: 'Figtree', sans-serif;
                        font-size: 0.85rem;
                        font-weight: 500;
                    ">
                        <span style="margin-right: 0.25rem;">🔍</span>
                        Click to view full size
                    </div>
                </div>
            </div>
            ` : `
            <div style="
                background: #fafafa;
                border: 2px dashed #e0e0e0;
                border-radius: 12px;
                padding: 2rem;
                text-align: center;
                margin-bottom: 1rem;
            ">
                <div style="font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.3;">📷</div>
                <p style="
                    margin: 0;
                    color: #9e9e9e;
                    font-family: 'Figtree', sans-serif;
                    font-style: italic;
                ">No photo provided for this incident</p>
            </div>
            `}
        `;
        
        document.getElementById('details-content').innerHTML = detailsHtml;
        document.getElementById('details-modal').style.display = 'flex';
    } catch (error) {
        console.error('Error in viewDetails:', error);
        alert('Error loading report details. Please try again.');
    }
}

function closeDetailsModal() {
    document.getElementById('details-modal').style.display = 'none';
}

// Image Viewer Function
function viewImage(imageUrl) {
    // Create image modal
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        cursor: pointer;
    `;
    
    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.cssText = `
        max-width: 90%;
        max-height: 90%;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    `;
    
    modal.appendChild(img);
    document.body.appendChild(modal);
    
    modal.onclick = function() {
        document.body.removeChild(modal);
    };
}

// Modal Event Handlers
document.addEventListener('DOMContentLoaded', function() {
    // Close modal when clicking outside
    window.onclick = function(event) {
        const statusModal = document.getElementById('status-modal');
        const detailsModal = document.getElementById('details-modal');
        
        if (event.target === statusModal) {
            closeModal();
        }
        if (event.target === detailsModal) {
            closeDetailsModal();
        }
    };
    
    // ESC key to close modals
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeModal();
            closeDetailsModal();
        }
    });
});