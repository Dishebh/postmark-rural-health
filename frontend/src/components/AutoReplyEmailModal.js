import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  CircularProgress,
  Alert,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const AutoReplyEmailModal = ({ open, onClose, email, loading, error }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="auto-reply-email-dialog-title"
      PaperProps={{
        sx: {
          height: { xs: "100%", sm: "80vh" },
          maxHeight: { xs: "100%", sm: "80vh" },
          margin: { xs: 0, sm: 2 },
          width: { xs: "100%", sm: "90%" },
        },
      }}
    >
      <DialogTitle
        id="auto-reply-email-dialog-title"
        sx={{
          m: 0,
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h6" component="div">
          Auto-Reply Email
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          p: 3,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          overflow: "auto",
        }}
      >
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 200,
            }}
          >
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : email ? (
          <>
            <Typography variant="subtitle1" color="text.secondary">
              Subject: {email.subject}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Sent on: {new Date(email.created_at).toLocaleString()}
            </Typography>
            <Box
              sx={{
                mt: 2,
                p: 2,
                bgcolor: "background.paper",
                borderRadius: 1,
                border: 1,
                borderColor: "divider",
              }}
            >
              <div
                style={{
                  fontFamily: "Arial, sans-serif",
                  fontSize: "14px",
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                }}
              >
                {email.body_html}
              </div>
            </Box>
          </>
        ) : (
          <Alert severity="info">No auto-reply email found</Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AutoReplyEmailModal;
