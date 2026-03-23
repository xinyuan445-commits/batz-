import { exec } from 'child_process';

console.log('⏳ Waiting for servers to start before opening browsers...');

// Wait for 5 seconds to ensure Vite dev servers and backend are up
setTimeout(() => {
  console.log('🌐 Opening browsers...');

  // Open Client (Dashboard) in Chrome in Fullscreen mode (allows exiting with F11)
  const clientUrl = 'http://localhost:5566';
  // Use PowerShell Start-Process to avoid some environment restrictions
  exec(`powershell -Command "Start-Process chrome -ArgumentList '--start-fullscreen ${clientUrl}'"`, (error) => {
    if (error) {
      console.log('⚠️ Failed to open Chrome via powershell. Trying cmd start...');
      exec(`start chrome --start-fullscreen "${clientUrl}"`, (err2) => {
          if(err2) console.error('Error:', err2);
      }); 
    } else {
      console.log(`✅ Opened Dashboard in Chrome (Fullscreen Mode) at ${clientUrl}`);
    }
  });

  // Open Admin in Edge
  const adminUrl = 'http://localhost:5173';
  exec(`powershell -Command "Start-Process msedge -ArgumentList '${adminUrl}'"`, (error) => {
    if (error) {
      console.log('⚠️ Failed to open Edge via powershell. Trying cmd start...');
      exec(`start msedge "${adminUrl}"`, (err2) => {
          if(err2) console.error('Error:', err2);
      });
    } else {
      console.log(`✅ Opened Admin Panel in Edge at ${adminUrl}`);
    }
  });

}, 5000);