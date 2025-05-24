import React, { useState } from "react";
import {
  Box,
  Container,
  Typography,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
} from "@mui/material";
import MedicalReportsTable from "./components/MedicalReportsTable";
import RespondersManager from "./components/RespondersManager";

function TabPanel({ children, value, index }) {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      sx={{ py: 3 }}
    >
      {value === index && children}
    </Box>
  );
}

function App() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box
      sx={{ flexGrow: 1, minHeight: "100vh", bgcolor: "background.default" }}
    >
      <AppBar position="static" color="primary" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Rural Health Triage Dashboard
          </Typography>
        </Toolbar>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="dashboard tabs"
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Tab label="Medical Reports" id="dashboard-tab-0" />
          <Tab label="Responders" id="dashboard-tab-1" />
        </Tabs>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <TabPanel value={tabValue} index={0}>
          <MedicalReportsTable />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <RespondersManager />
        </TabPanel>
      </Container>
    </Box>
  );
}

export default App;
