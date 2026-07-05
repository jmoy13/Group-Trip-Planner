import "server-only";

export async function sendInvitationEmail(params: { to: string; tripName: string; token: string }) {
  const inviteUrl = `${process.env.NEXTAUTH_URL}/invite/${params.token}`;
  console.log(
    `[email stub] Invitation to ${params.to} for trip "${params.tripName}": ${inviteUrl}`
  );
}

export async function sendPasswordResetEmail(params: { to: string; token: string }) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password/${params.token}`;
  console.log(`[email stub] Password reset for ${params.to}: ${resetUrl}`);
}
