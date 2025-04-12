import React, { useState } from 'react'
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import InputAdornment from "@mui/material/InputAdornment";
import {
    IconButton,
    Typography,
    TextField,
  } from "@mui/material";

function PasswordField({ onPasswordChange, visible = true, text=false }) {
    const [showPassword, setShowPassword] = useState(false);
  
    const handleClick = () => {
      setShowPassword(!showPassword);
      // console.log("Show password toggled:", !showPassword);
    };
  
    const handleChange = (e) => {
      const newPassword = e.target.value;
      onPasswordChange(newPassword); // Notify parent component of the password change
      // console.log("Password field changed, new value:", newPassword);
    };
  
    return (
      <div style={{ display: visible ? "block" : "none" }}>
        {text ? <Typography>Enter a password to send your message:</Typography> : null}
        <TextField
          type={showPassword ? "text" : "password"}
          label="Password"
          onChange={handleChange}
          fullWidth
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={handleClick} edge="end">
                  {showPassword ? <VisibilityOffIcon /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </div>
    );
}

export default PasswordField