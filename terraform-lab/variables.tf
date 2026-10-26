
variable "filename" {
  description = "Name of the file to create"
  type        = string
  default     = "hello.txt"
}

variable "message" {
  description = "Content to write into the file"
  type        = string
  default     = "Hello from Terraform Variables!"
}
