import ThresholdApp from "./app/App"
import { AuthProvider } from "./app/context/AuthContext"

export default function App() {
  return (
    <AuthProvider>
      <ThresholdApp />
    </AuthProvider>
  )
}
