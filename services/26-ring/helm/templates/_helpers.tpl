{{/*
Expand the name of the chart.
*/}}
{{- define "26-ring.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "26-ring.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "26-ring.labels" -}}
helm.sh/chart: {{ include "26-ring.name" . }}-{{ .Chart.Version | replace "+" "_" }}
{{ include "26-ring.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "26-ring.selectorLabels" -}}
app.kubernetes.io/name: {{ include "26-ring.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "26-ring.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "26-ring.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
