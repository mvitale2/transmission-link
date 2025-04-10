import React, { useState, useEffect } from 'react'
import { supabase } from "../../SupabaseClient";
import { Button, Stack, Container, Paper, Typography, TextField } from "@mui/material";

function Decrypt({ fileName }) {
  const [input, setInput] = useState('');
  const [decrypted, setDecrypted] = useState(false)
  const [fileContent, setFileContent] = useState(null);
  const [audio, setAudio] = useState(null);
  const [submitDisabled, setSubmitDisabled] = useState(true)
  const [stateMessage, setStateMessage] = useState(null);

  useEffect(() => {
    retrieveFile();
  }, [])

  const handleSubmit = async () => {
    try {
        const { arrayBuffer, saltB64, ivB64 } = fileContent;

        // Debugging logs
        // console.log("ArrayBuffer:", arrayBuffer);
        // console.log("Salt (Base64):", saltB64);
        // console.log("IV (Base64):", ivB64);

        const decryptedAudio = await decryptBlob(arrayBuffer, input, saltB64, ivB64)
        setAudio(decryptedAudio)
        setDecrypted(true)
    } catch (error) {
        console.log(error)
        setDecrypted(false)
    }
  }

  const retrieveFile = async () => {
    try {
      // Download the file
      const { data: fileData, error: fileError } = await supabase.storage
        .from('encrypted-audio-messages')
        .download(fileName);
  
      if (fileError) {
        console.error(`Error downloading file: ${fileError.message}`);
        return;
      }
  
      // Retrieve metadata for the file
      const { data: metadata, error: metadataError } = await supabase
        .from('message_metadata')
        .select('salt, iv')
        .eq('filename', fileName)
        .single();
  
      if (metadataError) {
        console.error(`Error retrieving metadata: ${metadataError.message}`);
        return;
      }
  
      const saltB64 = metadata.salt; // Retrieve salt from metadata
      const ivB64 = metadata.iv;     // Retrieve iv from metadata
  
      // Convert the file Blob to an ArrayBuffer
      const arrayBuffer = await fileData.arrayBuffer();
  
      // Store the file content and metadata
      setFileContent({ arrayBuffer, saltB64, ivB64 });
      // Submit is only enabled when there is a file to be decrypted
      setSubmitDisabled(false)
      console.log(`File and metadata retrieved successfully`);
    } catch (error) {
      console.error(`Error retrieving file or metadata: ${error.message}`);
    }
  };

  async function deriveKey(passphrase, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(passphrase),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    )

    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256},
      false,
      ["encrypt", "decrypt"]
    )
  }

  async function decryptBlob(ciphertext, passphrase, saltB64, ivB64) {
    try {
      const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
      const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
      const key = await deriveKey(passphrase, salt);
  
      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        ciphertext
      );
  
      setStateMessage(null)
      // Return a valid Blob
      return new Blob([decrypted], { type: "audio/webm" });
    } catch (error) {
      console.error("Error during decryption:", error);
      setStateMessage("Invalid password.")
      throw new Error("Decryption failed. Please check your passphrase.");
    }
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 10 }}>
        <Paper elevation={6} sx={{ p: 4, borderRadius: 4, backdropFilter: "blur(8px)" }}>
            <Typography variant='h4' align='center' gutterBottom>
                Enter the password to hear this message:
            </Typography>
            <TextField 
                fullWidth
                variant='outlined'
                label='Enter password'
                value={input}
                onChange={(e) => setInput(e.target.value)}
                sx={{ mb: 3 }}
                type='password'
            />
            <Stack direction='column' spacing={2} justifyContent='center' sx={{ mb: 2 }}>
                <Button variant='contained' color="primary" onClick={handleSubmit} disabled={submitDisabled}>
                    Submit
                </Button>
                {decrypted ? 
                    <audio
                        controls
                        src={URL.createObjectURL(audio)}
                    /> : null
                }
                {stateMessage ? (
                    <Typography variant='subtitle1' color='red'>
                        {stateMessage}
                    </Typography>
                ) : null}
            </Stack>
        </Paper>
    </Container>
  )
}

export default Decrypt