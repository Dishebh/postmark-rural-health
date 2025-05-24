import React from "react";
import {
  Box,
  Drawer,
  Typography,
  IconButton,
  Chip,
  Button,
  Divider,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ReplyIcon from "@mui/icons-material/Reply";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { format } from "date-fns";
import { CRITICAL_SYMPTOMS } from "./constants";

const ReportDetailsPanel = ({ report, open, onClose }) => {
  if (!report) return null;

  const symptoms = Array.isArray(JSON.parse(report.symptoms))
    ? JSON.parse(report.symptoms)
    : [];

  // Check if any symptoms match critical conditions
  const hasCriticalSymptoms = symptoms.some((symptom) =>
    CRITICAL_SYMPTOMS.some((critical) =>
      symptom.toLowerCase().includes(critical.toLowerCase())
    )
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 400 },
          p: 3,
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6" component="h2">
          Report Details
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      {hasCriticalSymptoms && (
        <Alert
          severity="warning"
          sx={{
            mb: 2,
            "& .MuiAlert-message": {
              fontWeight: 500,
            },
          }}
        >
          Urgent attention needed!
        </Alert>
      )}

      <Divider sx={{ mb: 3 }} />

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            Patient Name
          </Typography>
          <Typography variant="body1">{report.patient_name}</Typography>
        </Box>

        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            Email
          </Typography>
          <Typography variant="body1">{report.email}</Typography>
        </Box>

        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            Subject
          </Typography>
          <Typography variant="body1">{report.subject}</Typography>
        </Box>

        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Symptoms
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {symptoms.map((symptom, index) => (
              <Chip
                key={index}
                label={symptom}
                color="primary"
                variant="outlined"
                size="small"
              />
            ))}
          </Box>
        </Box>

        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            Location
          </Typography>
          <Typography variant="body1">
            {report.location || "Not specified"}
          </Typography>
        </Box>

        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            Created At
          </Typography>
          <Typography variant="body1">
            {format(new Date(report.created_at), "PPpp")}
          </Typography>
        </Box>

        <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<ReplyIcon />}
            fullWidth
            onClick={() => {
              // TODO: Implement reply functionality
              console.log("Reply to:", report.email);
            }}
          >
            Reply
          </Button>
          <Button
            variant="outlined"
            startIcon={<CheckCircleIcon />}
            fullWidth
            onClick={() => {
              // TODO: Implement mark as resolved functionality
              console.log("Mark as resolved:", report.id);
            }}
          >
            Mark Resolved
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default ReportDetailsPanel;
