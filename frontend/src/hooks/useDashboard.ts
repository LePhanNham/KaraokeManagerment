import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import dashboardService from '../services/dashboardService';

export const useDashboard = () => {
  const { user } = useAuth();
  const { notifySuccess, notifyError } = useNotification();

  // States
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Form states
  const [formData, setFormData] = useState<any>(dashboardService.getDefaultData());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // API calls
  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await dashboardService.getData();
      setData(result);
    } catch (error: any) {
      setError(error.message);
      notifyError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    // Validate form data
    const validationError = dashboardService.validate(formData);
    if (validationError) {
      setFormErrors({ general: validationError });
      return;
    }

    try {
      setLoading(true);
      await dashboardService.create(formData);
      notifySuccess('Tạo mới thành công');
      await loadData();
      handleCloseDialog();
    } catch (error: any) {
      setFormErrors({ general: error.message });
      notifyError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedItem?.id) return;

    // Validate form data
    const validationError = dashboardService.validate(formData);
    if (validationError) {
      setFormErrors({ general: validationError });
      return;
    }

    try {
      setLoading(true);
      await dashboardService.update(selectedItem.id, formData);
      notifySuccess('Cập nhật thành công');
      await loadData();
      handleCloseDialog();
    } catch (error: any) {
      setFormErrors({ general: error.message });
      notifyError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setLoading(true);
      await dashboardService.delete(id);
      notifySuccess('Xóa thành công');
      await loadData();
      setShowDeleteDialog(false);
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Dialog handlers
  const handleOpenCreateDialog = () => {
    setSelectedItem(null);
    setFormData(dashboardService.getDefaultData());
    setFormErrors({});
    setShowDialog(true);
  };

  const handleOpenEditDialog = (item: any) => {
    setSelectedItem(item);
    setFormData({ ...item });
    setFormErrors({});
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setSelectedItem(null);
    setFormData(dashboardService.getDefaultData());
    setFormErrors({});
    setShowDialog(false);
  };

  const handleOpenDeleteDialog = () => {
    setShowDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false);
  };

  // Form handlers
  const handleFormChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));

    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = () => {
    if (selectedItem) {
      handleUpdate();
    } else {
      handleCreate();
    }
  };

  const clearError = () => {
    setError('');
  };

  return {
    // States
    data,
    loading,
    error,
    selectedItem,
    showDialog,
    showDeleteDialog,
    formData,
    formErrors,

    // Actions
    loadData,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleOpenCreateDialog,
    handleOpenEditDialog,
    handleCloseDialog,
    handleOpenDeleteDialog,
    handleCloseDeleteDialog,
    handleFormChange,
    handleSubmit,
    clearError
  };
};