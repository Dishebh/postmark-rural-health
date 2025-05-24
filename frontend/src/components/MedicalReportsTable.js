import React, { useState, useEffect } from "react";
import { Box, Paper, Chip, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { format } from "date-fns";
import axios from "axios";

const MedicalReportsTable = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await axios.get("http://localhost:4000/api/reports");
        console.log("Fetched Reports Data:", response.data);
        setReports(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching reports:", err);
        setError("Failed to fetch reports");
        setLoading(false);
      }
    };

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
    <Paper sx={{ height: 600, width: "100%" }}>
      <DataGrid
        rows={reports}
        columns={columns}
        pageSize={10}
        rowsPerPageOptions={[10, 25, 50]}
        checkboxSelection
        disableSelectionOnClick
        loading={loading}
        getRowId={(row) => row.id}
      />
    </Paper>
  );
};

export default MedicalReportsTable;
