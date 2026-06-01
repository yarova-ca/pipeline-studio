{{/*
Expand the name of the chart.
*/}}
{{- define "07-sveltekit.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "07-sveltekit.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "07-sveltekit.labels" -}}
helm.sh/chart: {{ include "07-sveltekit.name" . }}-{{ .Chart.Version | replace "+" "_" }}
{{ include "07-sveltekit.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "07-sveltekit.selectorLabels" -}}
app.kubernetes.io/name: {{ include "07-sveltekit.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "07-sveltekit.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "07-sveltekit.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
