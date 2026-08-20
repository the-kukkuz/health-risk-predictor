variable "location" {
  description = "Azure region for all resources"
  type        = string
  default     = "Korea Central"
}

variable "resource_group_name" {
  description = "Resource group name"
  type        = string
  default     = "rg-health-risk-dev"
}

variable "acr_name" {
  description = "Globally unique Azure Container Registry name"
  type        = string
}

variable "container_app_environment_name" {
  description = "Container Apps environment name"
  type        = string
  default     = "cae-health-risk-dev"
}

variable "container_app_name" {
  description = "Backend Container App name"
  type        = string
  default     = "ca-health-risk-dev"
}

variable "log_analytics_name" {
  description = "Log Analytics workspace name"
  type        = string
  default     = "law-health-risk-dev"
}

variable "postgres_server_name" {
  description = "Globally unique PostgreSQL Flexible Server name"
  type        = string
}

variable "postgres_database_name" {
  description = "Application database name"
  type        = string
  default     = "healthrisk"
}

variable "postgres_admin_username" {
  description = "PostgreSQL administrator username"
  type        = string
  default     = "healthriskadmin"
}

variable "postgres_admin_password" {
  description = "PostgreSQL administrator password"
  type        = string
  sensitive   = true
}

variable "container_image" {
  description = "Container image deployed to Azure Container Apps"
  type        = string
  default     = "health-risk-backend:1.1.0"
}

variable "supabase_url" {
  description = "Supabase project URL"
  type        = string
  sensitive   = true
}

variable "supabase_anon_key" {
  description = "Supabase anonymous key"
  type        = string
  sensitive   = true
}

variable "supabase_jwt_secret" {
  description = "Supabase JWT secret"
  type        = string
  sensitive   = true
}