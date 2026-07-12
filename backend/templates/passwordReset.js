module.exports = ({ username, otp }) => {

return `

<html>

<body
style="font-family:Arial;background:#f4f4f4;padding:30px;">

<div
style="background:white;padding:40px;border-radius:10px;max-width:600px;margin:auto;">

<h2>Reset Your Password</h2>

<p>Hello ${username},</p>

<p>

We received a request to reset your password for your CeltiCore account.

</p>

<div
style="font-size:36px;
font-weight:bold;
letter-spacing:10px;
text-align:center;
padding:20px;
background:#111827;
color:white;
border-radius:8px;">

${otp}

</div>

<p>

This code is valid for
<strong>10 minutes</strong>.

</p>

<p>

If you didn't request this,
please ignore this email.

</p>

<br>

<b>

CeltiCore Team

</b>

</div>

</body>

</html>

`;

};