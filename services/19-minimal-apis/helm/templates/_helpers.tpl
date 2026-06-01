{{/*
Expand the name of the chart.
*/}}
{{- define "19-minimal-apis.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "19-minimal-apis.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "19-minimal-apis.labels" -}}
helm.sh/chart: {{ include "19-minimal-apis.name" . }}-{{ .Chart.Version | replace "+" "_" }}
{{ include "19-minimal-apis.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "19-minimal-apis.selectorLabels" -}}
app.kubernetes.io/name: {{ include "19-minimal-apis.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "19-minimal-apis.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "19-minimal-apis.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
