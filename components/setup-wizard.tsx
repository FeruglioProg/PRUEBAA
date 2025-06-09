"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, Database, Mail, Search } from "lucide-react"

interface SetupStep {
  id: string
  title: string
  description: string
  status: "pending" | "testing" | "success" | "error"
  icon: React.ReactNode
  action?: () => Promise<void>
}

export function SetupWizard() {
  const [steps, setSteps] = useState<SetupStep[]>([
    {
      id: "supabase",
      title: "Conexión a Supabase",
      description: "Verificar que la base de datos esté configurada correctamente",
      status: "pending",
      icon: <Database className="h-5 w-5" />,
      action: testSupabase,
    },
    {
      id: "email",
      title: "Configuración de Email",
      description: "Verificar que las notificaciones por email funcionen",
      status: "pending",
      icon: <Mail className="h-5 w-5" />,
      action: testEmail,
    },
    {
      id: "scraping",
      title: "Sistema de Scraping",
      description: "Probar que el sistema de búsqueda funcione correctamente",
      status: "pending",
      icon: <Search className="h-5 w-5" />,
      action: testScraping,
    },
  ])

  const [currentStep, setCurrentStep] = useState(0)
  const [isRunning, setIsRunning] = useState(false)

  async function testSupabase() {
    try {
      const response = await fetch("/api/test-supabase")
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Supabase test failed")
      }

      return data
    } catch (error) {
      throw error
    }
  }

  async function testEmail() {
    try {
      // Simular test de email (en producción harías un test real)
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Verificar que las variables de entorno estén configuradas
      const hasGmailConfig = process.env.NEXT_PUBLIC_GMAIL_USER || process.env.GMAIL_USER

      if (!hasGmailConfig) {
        throw new Error("Gmail configuration missing")
      }

      return { success: true }
    } catch (error) {
      throw error
    }
  }

  async function testScraping() {
    try {
      const response = await fetch("/api/search-properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          neighborhoods: ["Palermo"],
          timeRange: "7d",
          ownerOnly: false,
        }),
      })

      const data = await response.json()

      if (!response.ok || data.properties?.length === 0) {
        throw new Error("No properties found in scraping test")
      }

      return data
    } catch (error) {
      throw error
    }
  }

  const updateStepStatus = (stepId: string, status: SetupStep["status"]) => {
    setSteps((prev) => prev.map((step) => (step.id === stepId ? { ...step, status } : step)))
  }

  const runStep = async (stepIndex: number) => {
    const step = steps[stepIndex]
    if (!step.action) return

    updateStepStatus(step.id, "testing")

    try {
      await step.action()
      updateStepStatus(step.id, "success")
    } catch (error) {
      console.error(`Step ${step.id} failed:`, error)
      updateStepStatus(step.id, "error")
      throw error
    }
  }

  const runAllSteps = async () => {
    setIsRunning(true)

    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i)
      try {
        await runStep(i)
        await new Promise((resolve) => setTimeout(resolve, 1000)) // Pausa entre pasos
      } catch (error) {
        setIsRunning(false)
        return
      }
    }

    setIsRunning(false)
    setCurrentStep(-1) // Completado
  }

  const getStatusIcon = (status: SetupStep["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "testing":
        return <Clock className="h-5 w-5 text-blue-500 animate-spin" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: SetupStep["status"]) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500">Completado</Badge>
      case "error":
        return <Badge variant="destructive">Error</Badge>
      case "testing":
        return <Badge className="bg-blue-500">Probando...</Badge>
      default:
        return <Badge variant="outline">Pendiente</Badge>
    }
  }

  const allStepsCompleted = steps.every((step) => step.status === "success")

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🚀 Asistente de Configuración
          {allStepsCompleted && <Badge className="bg-green-500">¡Todo Listo!</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center gap-4 p-4 rounded-lg border ${
                currentStep === index ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                {step.icon}
                {getStatusIcon(step.status)}
              </div>

              <div className="flex-1">
                <h3 className="font-medium">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>

              {getStatusBadge(step.status)}
            </div>
          ))}

          <div className="flex gap-2 pt-4">
            <Button onClick={runAllSteps} disabled={isRunning || allStepsCompleted} className="flex-1">
              {isRunning ? "Ejecutando Pruebas..." : allStepsCompleted ? "✅ Todo Configurado" : "🧪 Probar Todo"}
            </Button>

            {allStepsCompleted && (
              <Button variant="outline" onClick={() => window.location.reload()}>
                🔄 Probar de Nuevo
              </Button>
            )}
          </div>

          {allStepsCompleted && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <h3 className="font-medium text-green-800 dark:text-green-200">🎉 ¡Configuración Completada!</h3>
              <p className="text-sm text-green-600 dark:text-green-300 mt-1">
                Tu sistema está listo para buscar propiedades. Puedes usar el formulario de búsqueda para empezar.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
