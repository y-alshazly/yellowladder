import { Container, Typography } from '@mui/material';

export function App() {
  return (
    <Container maxWidth="sm" sx={{ mt: 8, textAlign: 'center' }}>
      <Typography variant="h3" component="h1">
        YellowLadder
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
        Hello World
      </Typography>
    </Container>
  );
}
