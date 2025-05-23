import React from "react";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container,
  Box,
  Typography,
  AppBar,
  Toolbar,
} from "@mui/material";
import MedicalReportsTable from "./components/MedicalReportsTable";
import DashboardStats from "./components/DashboardStats";

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
    background: {
      default: "#f5f5f5",
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Rural Health Triage Dashboard
            </Typography>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <DashboardStats />
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Medical Reports
            </Typography>
            <MedicalReportsTable />
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
