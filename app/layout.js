import "../styles/globals.css";

export const metadata = {
  title: "GPU Architecture Simulator",
  description: "Interactive educational simulation of GPU architecture and parallel processing"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
