import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiFolder, FiUser, FiCalendar, FiDollarSign, FiX, FiCheck, FiEye } from 'react-icons/fi';
import ProjectDetails from './ProjectDetails';

const AdminProjects = () => {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [formData, setFormData] = useState({
    clientId: '',
    projectName: '',
    projectType: '',
    description: '',
    totalAmount: '',
    startDate: '',
    deadline: '',
    priority: 'medium',
    notes: ''
  });

  useEffect(() => {
    fetchProjects();
    fetchClients();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/api/projects', {
        params: { search: searchTerm, status: statusFilter }
      });
      if (response.data.success) {
        setProjects(response.data.projects);
      }
    } catch (error) {
      toast.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await axios.get('/api/clients');
      if (response.data.success) {
        setClients(response.data.clients);
      }
    } catch (error) {
      console.error('Failed to fetch clients');
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProjects();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, statusFilter]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const resetForm = () => {
    setFormData({
      clientId: '',
      projectName: '',
      projectType: '',
      description: '',
      totalAmount: '',
      startDate: '',
      deadline: '',
      priority: 'medium',
      notes: ''
    });
    setEditingProject(null);
  };

  const openModal = (project = null) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        clientId: project.clientId?._id || project.clientId,
        projectName: project.projectName,
        projectType: project.projectType,
        description: project.description || '',
        totalAmount: project.totalAmount,
        startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
        deadline: project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '',
        priority: project.priority,
        notes: project.notes || ''
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.clientId || !formData.projectName || !formData.projectType || !formData.totalAmount) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editingProject) {
        const response = await axios.put(`/api/projects/${editingProject._id}`, formData);
        if (response.data.success) {
          toast.success('Project updated successfully');
          fetchProjects();
          closeModal();
        }
      } else {
        const response = await axios.post('/api/projects', formData);
        if (response.data.success) {
          toast.success('Project created successfully');
          fetchProjects();
          closeModal();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      const response = await axios.delete(`/api/projects/${projectId}`);
      if (response.data.success) {
        toast.success('Project deleted successfully');
        fetchProjects();
      }
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  const handleStatusChange = async (projectId, newStatus) => {
    try {
      const response = await axios.put(`/api/projects/${projectId}`, { status: newStatus });
      if (response.data.success) {
        toast.success('Status updated successfully');
        fetchProjects();
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="admin-projects-page">
      <div className="page-container">
        <div className="page-header">
          <div className="header-content">
            <h1>Projects</h1>
            <p>Manage all client projects</p>
          </div>
          <button onClick={() => openModal()} className="add-btn">
            <FiPlus />
            <span>Add Project</span>
          </button>
        </div>

        <div className="filters-bar">
          <div className="search-bar">
            <FiSearch />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="on_hold">On Hold</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="projects-list">
          {projects.length === 0 ? (
            <div className="no-data">
              <FiFolder />
              <p>No projects found</p>
              <button onClick={() => openModal()} className="add-btn">
                <FiPlus />
                <span>Add your first project</span>
              </button>
            </div>
          ) : (
            projects.map((project) => (
              <div key={project._id} className="project-card">
                <div className="project-header">
                  <div className="project-info">
                    <h3>{project.projectName}</h3>
                    <p className="project-type">{project.projectType}</p>
                  </div>
                  <select
                    value={project.status}
                    onChange={(e) => handleStatusChange(project._id, e.target.value)}
                    className={`status-select ${project.status}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="project-client">
                  <FiUser />
                  <span>{project.clientId?.name || 'Unknown Client'}</span>
                  <span className="client-code">({project.clientId?.clientCode || 'N/A'})</span>
                </div>

                <div className="project-details">
                  <div className="detail-item">
                    <FiDollarSign />
                    <span>Total: ₹{project.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="detail-item">
                    <FiDollarSign />
                    <span>Paid: ₹{project.paidAmount.toLocaleString()}</span>
                  </div>
                  <div className="detail-item">
                    <FiDollarSign />
                    <span>Pending: ₹{project.pendingAmount.toLocaleString()}</span>
                  </div>
                  {project.deadline && (
                    <div className="detail-item">
                      <FiCalendar />
                      <span>Deadline: {new Date(project.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="project-priority">
                  <span className={`priority-badge ${project.priority}`}>
                    {project.priority}
                  </span>
                </div>

                <div className="project-actions">
                  <button onClick={() => setSelectedProjectId(project._id)} className="details-btn" title="View Details">
                    <FiEye />
                    <span>Details</span>
                  </button>
                  <button onClick={() => openModal(project)} className="edit-btn">
                    <FiEdit2 />
                    <span>Edit</span>
                  </button>
                  <button onClick={() => handleDelete(project._id)} className="delete-btn">
                    <FiTrash2 />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProject ? 'Edit Project' : 'Add New Project'}</h2>
              <button onClick={closeModal} className="close-btn">
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="clientId">Client *</label>
                <select
                  id="clientId"
                  name="clientId"
                  value={formData.clientId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => (
                    <option key={client._id} value={client._id}>
                      {client.name} ({client.clientCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="projectName">Project Name *</label>
                  <input
                    type="text"
                    id="projectName"
                    name="projectName"
                    value={formData.projectName}
                    onChange={handleChange}
                    placeholder="Project name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="projectType">Project Type *</label>
                  <input
                    type="text"
                    id="projectType"
                    name="projectType"
                    value={formData.projectType}
                    onChange={handleChange}
                    placeholder="e.g., Website, App, Design"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Project description..."
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="totalAmount">Total Amount (₹) *</label>
                  <input
                    type="number"
                    id="totalAmount"
                    name="totalAmount"
                    value={formData.totalAmount}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="priority">Priority</label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startDate">Start Date</label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="deadline">Deadline</label>
                  <input
                    type="date"
                    id="deadline"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Additional notes..."
                  rows="2"
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  <FiCheck />
                  <span>{editingProject ? 'Update' : 'Create'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Details Modal */}
      {selectedProjectId && (
        <ProjectDetails 
          projectId={selectedProjectId}
          onClose={() => setSelectedProjectId(null)}
        />
      )}
    </div>
  );
};

export default AdminProjects;
