{{/*
Expand the name of the chart.
*/}}
{{- define "14-deno.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "14-deno.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "14-deno.labels" -}}
helm.sh/chart: {{ include "14-deno.name" . }}-{{ .Chart.Version | replace "+" "_" }}
{{ include "14-deno.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "14-deno.selectorLabels" -}}
app.kubernetes.io/name: {{ include "14-deno.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "14-deno.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "14-deno.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
