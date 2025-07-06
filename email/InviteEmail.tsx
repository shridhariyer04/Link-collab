// email/InviteEmail.tsx
import React from 'react';
import { Html, Body, Container, Text, Button, Head, Preview } from '@react-email/components';

interface InviteEmailProps {
  boardName: string;
}

export const InviteEmail: React.FC<InviteEmailProps> = ({ boardName }) => {
  return (
    <Html>
      <Head />
      <Preview>You've been invited to collaborate on {boardName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={heading}>You're invited to collaborate!</Text>
          <Text style={paragraph}>
            You've been invited to join the board "{boardName}" on Link Organizer.
          </Text>
          <Text style={paragraph}>
            Click the button below to accept the invitation and start collaborating.
          </Text>
          <Button
            style={button}
            href={`${process.env.NEXT_PUBLIC_APP_URL}`}
          >
            Accept Invitation
          </Button>
          <Text style={paragraph}>
            If you don't have an account yet, you'll be able to create one when you click the link above.
          </Text>
          <Text style={footer}>
            If you didn't expect this invitation, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const heading = {
  fontSize: '32px',
  lineHeight: '1.3',
  fontWeight: '700',
  color: '#484848',
  padding: '17px 0 0',
};

const paragraph = {
  fontSize: '18px',
  lineHeight: '1.4',
  color: '#484848',
  padding: '0 0 24px',
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '18px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '12px 0',
  margin: '24px 0',
};

const footer = {
  color: '#9ca299',
  fontSize: '14px',
  marginTop: '24px',
};

export default InviteEmail;