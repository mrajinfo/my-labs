
output "created_file_path" {
  description = "Path of the created file"
  value       = local_file.hello.filename
}

output "file_message" {
  description = "Message written to the file"
  value       = local_file.hello.content
}
