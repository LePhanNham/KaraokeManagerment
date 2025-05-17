import React, { useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Box,
  Snackbar,
  Alert,
  styled,
  Theme
} from '@mui/material';

interface SettingsState {
  businessName: string;
  address: string;
  phone: string;
  email: string;
  taxCode: string;
  enableNotifications: boolean;
  enableEmailNotifications: boolean;
  enableSMSNotifications: boolean;
  maintenanceMode: boolean;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
}

const ContentContainer = styled(Container)(({ theme }: { theme: Theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
}));

const PageTitle = styled(Typography)(({ theme }: { theme: Theme }) => ({
  marginBottom: theme.spacing(3),
  fontWeight: 600,
  color: theme.palette.primary.dark,
}));

const ContentPaper = styled(Paper)(({ theme }: { theme: Theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[1],
}));

const Section = styled('div')(({ theme }: { theme: Theme }) => ({
  marginBottom: theme.spacing(4),
}));

const SectionTitle = styled(Typography)(({ theme }: { theme: Theme }) => ({
  marginBottom: theme.spacing(2),
  fontWeight: 500,
  color: theme.palette.text.primary,
}));

const FormContainer = styled('form')(({ theme }: { theme: Theme }) => ({
  '& .MuiTextField-root': {
    marginBottom: theme.spacing(2),
  },
}));

const CustomDivider = styled(Divider)(({ theme }: { theme: Theme }) => ({
  margin: theme.spacing(3, 0),
}));

const SaveButton = styled(Button)(({ theme }: { theme: Theme }) => ({
  marginTop: theme.spacing(2),
  padding: theme.spacing(1, 4),
}));

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsState>({
    businessName: 'Karaoke Pro',
    address: '123 Đường ABC, Quận XYZ, TP.HCM',
    phone: '0123456789',
    email: 'contact@karaokepro.com',
    taxCode: '1234567890',
    enableNotifications: true,
    enableEmailNotifications: false,
    enableSMSNotifications: true,
    maintenanceMode: false,
  });

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleChange = (field: keyof SettingsState) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      // TODO: Implement API call to save settings
      setSnackbar({
        open: true,
        message: 'Cài đặt đã được lưu thành công',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Không thể lưu cài đặt. Vui lòng thử lại.',
        severity: 'error',
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <ContentContainer maxWidth="lg">
      <PageTitle variant="h5">
        Cài đặt hệ thống
      </PageTitle>

      <ContentPaper>
        <Section>
          <SectionTitle variant="h6">
            Thông tin doanh nghiệp
          </SectionTitle>
          <FormContainer>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tên doanh nghiệp"
                  value={settings.businessName}
                  onChange={handleChange('businessName')}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Địa chỉ"
                  value={settings.address}
                  onChange={handleChange('address')}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Số điện thoại"
                  value={settings.phone}
                  onChange={handleChange('phone')}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={settings.email}
                  onChange={handleChange('email')}
                  variant="outlined"
                  type="email"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Mã số thuế"
                  value={settings.taxCode}
                  onChange={handleChange('taxCode')}
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </FormContainer>
        </Section>

        <CustomDivider />

        <Section>
          <SectionTitle variant="h6">
            Thông báo
          </SectionTitle>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enableNotifications}
                    onChange={handleChange('enableNotifications')}
                    color="primary"
                  />
                }
                label="Bật thông báo hệ thống"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enableEmailNotifications}
                    onChange={handleChange('enableEmailNotifications')}
                    color="primary"
                  />
                }
                label="Thông báo qua email"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enableSMSNotifications}
                    onChange={handleChange('enableSMSNotifications')}
                    color="primary"
                  />
                }
                label="Thông báo qua SMS"
              />
            </Grid>
          </Grid>
        </Section>

        <CustomDivider />

        <Section>
          <SectionTitle variant="h6">
            Bảo trì
          </SectionTitle>
          <FormControlLabel
            control={
              <Switch
                checked={settings.maintenanceMode}
                onChange={handleChange('maintenanceMode')}
                color="primary"
              />
            }
            label="Chế độ bảo trì"
          />
        </Section>

        <Box display="flex" justifyContent="flex-end">
          <SaveButton
            variant="contained"
            color="primary"
            onClick={handleSave}
          >
            Lưu cài đặt
          </SaveButton>
        </Box>
      </ContentPaper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          elevation={6}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ContentContainer>
  );
};

export default Settings;