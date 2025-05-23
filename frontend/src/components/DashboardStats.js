import React, { useState, useEffect } from "react";
import { Grid, Paper, Typography, Box } from "@mui/material";
import axios from "axios";

const StatCard = ({ title, value, color }) => (
  <Paper
    sx={{
      p: 2,
      display: "flex",
      flexDirection: "column",
      height: 140,
      bgcolor: color || "primary.light",
      color: "white",
    }}
  >
    <Typography component="h2" variant="h6" gutterBottom>
      {title}
    </Typography>
    <Typography component="p" variant="h4">
      {value}
    </Typography>
  </Paper>
);

const DashboardStats = () => {
  const [stats, setStats] = useState({
    totalReports: 0,
    reportsToday: 0,
    uniqueLocations: 0,
    commonSymptom: "None",
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/stats");
        setStats(response.data);
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Total Reports"
          value={stats.totalReports}
          color="#1976d2"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Reports Today"
          value={stats.reportsToday}
          color="#2e7d32"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Unique Locations"
          value={stats.uniqueLocations}
          color="#ed6c02"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Most Common Symptom"
          value={stats.commonSymptom}
          color="#9c27b0"
        />
      </Grid>
    </Grid>
  );
};

export default DashboardStats;
