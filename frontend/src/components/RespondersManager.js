import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import axios from "axios";

const RespondersManager = () => {
  const [responders, setResponders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingResponder, setEditingResponder] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const fetchResponders = async () => {
    try {
      setRefreshing(true);
      const response = await axios.get("http://localhost:4000/api/responders");
      setResponders(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching responders:", err);
      setError("Failed to fetch responders");
      setSnackbar({
        open: true,
        message: "Failed to fetch responders",
        severity: "error",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchResponders();
  }, []);

  const handleOpenDialog = (responder = null) => {
    if (responder) {
      setEditingResponder(responder);
      setFormData({ name: responder.name, email: responder.email });
    } else {
      setEditingResponder(null);
      setFormData({ name: "", email: "" });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingResponder(null);
    setFormData({ name: "", email: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingResponder) {
        // TODO: Implement update endpoint
        // await axios.patch(`http://localhost:4000/api/responders/${editingResponder.id}`, formData);
        setSnackbar({
          open: true,
          message: "Update functionality coming soon",
          severity: "info",
        });
      } else {
        await axios.post("http://localhost:4000/api/responders", formData);
        setSnackbar({
          open: true,
          message: "Responder added successfully",
          severity: "success",
        });
      }
      handleCloseDialog();
      fetchResponders();
    } catch (error) {
      console.error("Error saving responder:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || "Failed to save responder",
        severity: "error",
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this responder?"))
      return;

    try {
      // TODO: Implement delete endpoint
      // await axios.delete(`http://localhost:4000/api/responders/${id}`);
      setSnackbar({
        open: true,
        message: "Delete functionality coming soon",
        severity: "info",
      });
      // fetchResponders();
    } catch (error) {
      console.error("Error deleting responder:", error);
      setSnackbar({
        open: true,
        message: "Failed to delete responder",
        severity: "error",
      });
    }
  };

  const columns = [
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      minWidth: 200,
    },
    {
      field: "email",
      headerName: "Email",
      flex: 1,
      minWidth: 250,
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDialog(params.row);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(params.row.id);
              }}
            >
              <DeleteIcon fontSize="small" color="error" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

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
          Responders
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Tooltip title="Refresh Data">
            <IconButton
              onClick={fetchResponders}
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
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Responder
          </Button>
        </Box>
      </Box>

      <Paper sx={{ height: 400, width: "100%" }}>
        <DataGrid
          rows={responders}
          columns={columns}
          pageSize={5}
          rowsPerPageOptions={[5, 10, 25]}
          disableSelectionOnClick
          loading={loading || refreshing}
          getRowId={(row) => row.id}
          sx={{
            "& .MuiDataGrid-cell:focus": {
              outline: "none",
            },
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "background.paper",
            },
            "& .MuiDataGrid-row": {
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.04)",
              },
            },
          }}
        />
      </Paper>

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingResponder ? "Edit Responder" : "Add New Responder"}
          </DialogTitle>
          <DialogContent>
            <Box
              sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}
            >
              <TextField
                autoFocus
                label="Name"
                fullWidth
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
              <TextField
                label="Email"
                type="email"
                fullWidth
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                helperText="Enter a valid email address"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingResponder ? "Update" : "Add"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RespondersManager;
