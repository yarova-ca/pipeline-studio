{{/*
Expand the name of the chart.
*/}}
{{- define "28-dotnet-grpc.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "28-dotnet-grpc.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "28-dotnet-grpc.labels" -}}
helm.sh/chart: {{ include "28-dotnet-grpc.name" . }}-{{ .Chart.Version | replace "+" "_" }}
{{ include "28-dotnet-grpc.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "28-dotnet-grpc.selectorLabels" -}}
app.kubernetes.io/name: {{ include "28-dotnet-grpc.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "28-dotnet-grpc.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "28-dotnet-grpc.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
