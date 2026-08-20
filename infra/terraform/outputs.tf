output "resource_group_name" {
  value = azurerm_resource_group.main.name
}

output "acr_login_server" {
  value = azurerm_container_registry.main.login_server
}

output "acr_name" {
  value = azurerm_container_registry.main.name
}

output "container_app_environment_name" {
  value = azurerm_container_app_environment.main.name
}

output "postgres_server_fqdn" {
  value = azurerm_postgresql_flexible_server.main.fqdn
}

output "postgres_database_name" {
  value = azurerm_postgresql_flexible_server_database.main.name
}

output "container_app_url" {
  value = "https://${azurerm_container_app.backend.ingress[0].fqdn}"
}

output "container_app_fqdn" {
  value = azurerm_container_app.backend.ingress[0].fqdn
}