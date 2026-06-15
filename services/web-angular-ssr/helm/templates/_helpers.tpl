{{/*
Expand the name of the chart.
*/}}
{{- define "01-angular-ssr.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "01-angular-ssr.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "01-angular-ssr.labels" -}}
helm.sh/chart: {{ include "01-angular-ssr.name" . }}-{{ .Chart.Version | replace "+" "_" }}
{{ include "01-angular-ssr.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "01-angular-ssr.selectorLabels" -}}
app.kubernetes.io/name: {{ include "01-angular-ssr.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "01-angular-ssr.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "01-angular-ssr.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
