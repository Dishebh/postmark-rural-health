import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Chip,
  Typography,
  IconButton,
  Tooltip,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { format } from "date-fns";
import axios from "axios";
import RefreshIcon from "@mui/icons-material/Refresh";
import WarningIcon from "@mui/icons-material/Warning";
import ReportDetailsPanel from "./ReportDetailsPanel";
import { CRITICAL_SYMPTOMS } from "./constants";

// Reuse the same critical symptoms list
const MedicalReportsTable = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);

  // Function to check if a report has critical symptoms
  const hasCriticalSymptoms = (symptoms) => {
    try {
      const symptomList = Array.isArray(JSON.parse(symptoms))
        ? JSON.parse(symptoms)
        : [];
      return symptomList.some((symptom) =>
        CRITICAL_SYMPTOMS.some((critical) =>
          symptom.toLowerCase().includes(critical.toLowerCase())
        )
      );
    } catch (e) {
      return false;
    }
  };

  const fetchReports = async () => {
    try {
      setRefreshing(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/reports`
      );
      console.log("Fetched Reports Data:", response.data);
      setReports(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("Failed to fetch reports");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleRowClick = (params) => {
    setSelectedReport(params.row);
    setPanelOpen(true);
  };

  const handlePanelClose = () => {
    setPanelOpen(false);
    setSelectedReport(null);
  };

  const handleAssignmentChange = (updatedReport) => {
    setReports(
      reports.map((report) =>
        report.id === updatedReport.id ? updatedReport : report
      )
    );
    setSelectedReport(updatedReport);
  };

  const columns = [
    {
      field: "warning",
      headerName: "",
      width: 40,
      sortable: false,
      renderCell: (params) => {
        if (hasCriticalSymptoms(params.row.symptoms)) {
          return (
            <Tooltip title="Urgent attention needed">
              <WarningIcon
                sx={{
                  color: "warning.main",
                  fontSize: "1.2rem",
                }}
              />
            </Tooltip>
          );
        }
        return null;
      },
    },
    {
      field: "created_at",
      headerName: "Created At",
      width: 180,
      valueFormatter: (params) => format(new Date(params.value), "PPpp"),
    },
    {
      field: "patient_name",
      headerName: "Patient Name",
      width: 150,
    },
    {
      field: "email",
      headerName: "Email",
      width: 200,
    },
    {
      field: "subject",
      headerName: "Subject",
      width: 200,
    },
    {
      field: "symptoms",
      headerName: "Symptoms",
      width: 250,
      renderCell: (params) => {
        return (
          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
            {Array.isArray(JSON.parse(params.value)) ? (
              Array.from(new Set(JSON.parse(params.value))).map(
                (symptom, index) => (
                  <Chip
                    key={index}
                    label={symptom}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )
              )
            ) : (
              <Typography color="error">
                Invalid symptoms data: {JSON.stringify(params.value)}
              </Typography>
            )}
          </Box>
        );
      },
    },
    {
      field: "location",
      headerName: "Location",
      width: 150,
    },
  ];

  if (error) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography color="error">{error}</Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6" component="h2">
          Medical Reports
        </Typography>
        <Tooltip title="Refresh Data">
          <IconButton
            onClick={fetchReports}
            disabled={refreshing}
            sx={{
              transition: "transform 0.2s",
              transform: refreshing ? "rotate(180deg)" : "none",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.04)",
              },
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Paper sx={{ height: 600, width: "100%" }}>
        <DataGrid
          rows={reports}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
          loading={loading || refreshing}
          getRowId={(row) => row.id}
          onRowClick={handleRowClick}
          sx={{
            "& .MuiDataGrid-row": {
              "&:hover": {
                cursor: "pointer",
                backgroundColor: "rgba(0, 0, 0, 0.04)",
              },
              "&.Mui-selected": {
                backgroundColor: "rgba(25, 118, 210, 0.08)",
                "&:hover": {
                  backgroundColor: "rgba(25, 118, 210, 0.12)",
                },
              },
              // Style for rows with critical symptoms
              "&.urgent-row": {
                backgroundColor: "rgba(255, 152, 0, 0.08)",
                "&:hover": {
                  backgroundColor: "rgba(255, 152, 0, 0.12)",
                },
                "&.Mui-selected": {
                  backgroundColor: "rgba(255, 152, 0, 0.16)",
                  "&:hover": {
                    backgroundColor: "rgba(255, 152, 0, 0.2)",
                  },
                },
              },
            },
          }}
          getRowClassName={(params) =>
            hasCriticalSymptoms(params.row.symptoms) ? "urgent-row" : ""
          }
        />
      </Paper>

      <ReportDetailsPanel
        report={selectedReport}
        open={panelOpen}
        onClose={handlePanelClose}
        onAssignmentChange={handleAssignmentChange}
      />
    </Box>
  );
};

export default MedicalReportsTable;
