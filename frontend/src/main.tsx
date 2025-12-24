import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          classNames: {
            success: "!bg-green-50 !text-green-800 !border-green-300",
            error: "!bg-red-50 !text-red-800 !border-red-300",
          },
        }}
      />
    </QueryClientProvider>
  </StrictMode >,
)
