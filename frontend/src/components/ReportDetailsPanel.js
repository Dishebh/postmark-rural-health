import React, { useState, useEffect } from "react";
import {
  Box,
  Drawer,
  Typography,
  IconButton,
  Chip,
  Button,
  Divider,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ReplyIcon from "@mui/icons-material/Reply";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EmailIcon from "@mui/icons-material/Email";
import { format } from "date-fns";
import { CRITICAL_SYMPTOMS } from "./constants";
import RequestTimeline from "./RequestTimeline";
import AutoReplyEmailModal from "./AutoReplyEmailModal";
import axios from "axios";

const ReportDetailsPanel = ({ report, open, onClose, onAssignmentChange }) => {
  const [responders, setResponders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });
  const [autoReplyModalOpen, setAutoReplyModalOpen] = useState(false);
  const [autoReplyEmail, setAutoReplyEmail] = useState(null);
  const [autoReplyLoading, setAutoReplyLoading] = useState(false);
  const [autoReplyError, setAutoReplyError] = useState(null);

  useEffect(() => {
    const fetchResponders = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/responders`
        );
        setResponders(response.data);
      } catch (error) {
        console.error("Error fetching responders:", error);
        setSnackbar({
          open: true,
          message: "Failed to load responders",
          severity: "error",
        });
      }
    };

    if (open) {
      fetchResponders();
    }
  }, [open]);

  const handleAssign = async (responderId) => {
    if (!report || !responderId) return;

    setLoading(true);
    try {
      const response = await axios.patch(
        `${process.env.REACT_APP_API_URL}/api/reports/${report.id}/assign`,
        { responder_id: responderId }
      );

      setSnackbar({
        open: true,
        message: response.data.message,
        severity: "success",
      });

      // Notify parent component to refresh the report
      if (onAssignmentChange) {
        onAssignmentChange(response.data.report);
      }
    } catch (error) {
      console.error("Error assigning responder:", error);
      setSnackbar({
        open: true,
        message: "Failed to assign responder",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewAutoReply = async () => {
    if (!report) return;

    setAutoReplyModalOpen(true);
    setAutoReplyLoading(true);
    setAutoReplyError(null);

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/reports/${report.id}/auto-reply`
      );
      setAutoReplyEmail(response.data);
    } catch (error) {
      console.error("Error fetching auto-reply email:", error);
      setAutoReplyError(
        error.response?.data?.error || "Failed to fetch auto-reply email"
      );
    } finally {
      setAutoReplyLoading(false);
    }
  };

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
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: 400 },
            p: 3,
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <Box sx={{ flex: "0 0 auto" }}>
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
              <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{ mb: 1 }}
              >
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

            <Box>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Assignee
              </Typography>
              <FormControl fullWidth size="small">
                <InputLabel id="assignee-select-label">
                  Select Responder
                </InputLabel>
                <Select
                  labelId="assignee-select-label"
                  value={report.responder_id || ""}
                  label="Select Responder"
                  onChange={(e) => handleAssign(e.target.value)}
                  disabled={loading}
                >
                  <MenuItem value="">
                    <em>Unassigned</em>
                  </MenuItem>
                  {responders.map((responder) => (
                    <MenuItem key={responder.id} value={responder.id}>
                      {responder.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          <Box sx={{ mt: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
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
              startIcon={<EmailIcon />}
              fullWidth
              onClick={handleViewAutoReply}
            >
              View Auto-Reply
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

        <Divider sx={{ my: 3 }} />

        <Box sx={{ flex: "1 1 auto", overflow: "auto" }}>
          <RequestTimeline report={report} />
        </Box>
      </Drawer>

      <AutoReplyEmailModal
        open={autoReplyModalOpen}
        onClose={() => {
          setAutoReplyModalOpen(false);
          setAutoReplyEmail(null);
          setAutoReplyError(null);
        }}
        email={autoReplyEmail}
        loading={autoReplyLoading}
        error={autoReplyError}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </>
  );
};

export default ReportDetailsPanel;
