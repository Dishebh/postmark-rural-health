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

const MedicalReportsTable = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = async () => {
    try {
      setRefreshing(true);
      const response = await axios.get("http://localhost:4000/api/reports");
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
    // Refresh data every 30 seconds
    const interval = setInterval(fetchReports, 30000);
    return () => clearInterval(interval);
  }, []);

  const columns = [
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
          checkboxSelection
          disableSelectionOnClick
          loading={loading || refreshing}
          getRowId={(row) => row.id}
        />
      </Paper>
    </Box>
  );
};

export default MedicalReportsTable;
