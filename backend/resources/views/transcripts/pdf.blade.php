<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Transcript</title>
    <style>
        body {
            font-family: 'DejaVu Sans', sans-serif;
            margin: 0;
            padding: 30px;
            font-size: 12px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .header h1 {
            font-size: 24px;
            margin: 0;
            color: #1a365d;
        }
        .header h2 {
            font-size: 18px;
            margin: 5px 0 0 0;
            letter-spacing: 2px;
        }
        .title {
            text-align: center;
            font-size: 20px;
            font-weight: bold;
            margin: 20px 0;
            letter-spacing: 5px;
            border-top: 1px solid #ccc;
            border-bottom: 1px solid #ccc;
            padding: 5px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th, td {
            border: 1px solid #ccc;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f8fafc;
            font-weight: bold;
            text-align: center;
        }
        .info-table td {
            border: 1px solid #ccc;
        }
        .info-table .label {
            font-weight: bold;
            width: 25%;
            background-color: #f8fafc;
        }
        .section-title {
            text-align: center;
            font-weight: bold;
            font-size: 14px;
            margin: 15px 0 10px 0;
            background-color: #f8fafc;
            padding: 5px;
            border: 1px solid #ccc;
            border-bottom: none;
        }
        .footer {
            margin-top: 40px;
            clear: both;
        }
        .footer-left {
            float: left;
            width: 50%;
        }
        .footer-right {
            float: right;
            width: 40%;
            text-align: center;
        }
        .totals-table {
            width: 100%;
        }
        .totals-table th {
            text-align: left;
        }
        .totals-table td {
            text-align: center;
            font-weight: bold;
        }
        .signature-line {
            border-top: 1px dashed #333;
            margin-top: 50px;
            padding-top: 5px;
        }
    </style>
</head>
<body>

    <div class="header">
        <h1>IAC</h1>
        <p>INTERNATIONAL ACCREDITATION CERTIFICATION</p>
        <p><i>"International Career For Professionals"</i></p>
        <p style="font-size: 10px;">CONTINUING EDUCATION APPLICATION AND RESEARCH CENTER</p>
    </div>

    <div class="title">TRANSCRIPT</div>

    <table class="info-table">
        <tr>
            <td class="label">NAME SURNAME</td>
            <td>{{ $certificate->student->first_name }} {{ $certificate->student->last_name }}</td>
            <td class="label">DATE</td>
            <td>{{ \Carbon\Carbon::parse($certificate->issue_date)->format('d.m.Y') }}</td>
        </tr>
        <tr>
            <td class="label">NATIONALITY</td>
            <td>T.R. (Turkey)</td>
            <td class="label">ID NO</td>
            <td>{{ $certificate->student->tc_number }}</td>
        </tr>
        <tr>
            <td class="label">PROGRAM</td>
            <td colspan="3">
                @php
                    $nameData = $certificate->training_program->name;
                    $certLang = $certificate->certificate_language ?? 'tr';
                    if (is_array($nameData)) {
                        echo $nameData[$certLang] ?? $nameData['tr'] ?? current($nameData) ?? '';
                    } else {
                        echo $nameData;
                    }
                @endphp
            </td>
        </tr>
    </table>

    <div class="section-title">COURSE MODULES</div>
    <table>
        <thead>
            <tr>
                <th>COURSE CODE</th>
                <th>COURSE NAME (Turkish)</th>
                <th>COURSE NAME (English)</th>
                <th>HOURS</th>
                <th>GRADE</th>
                <th>POINT</th>
            </tr>
        </thead>
        <tbody>
            @if(isset($transcriptData['course_modules']) && is_array($transcriptData['course_modules']))
                @foreach($transcriptData['course_modules'] as $module)
                <tr>
                    <td style="text-align: center;">{{ $loop->iteration }}</td>
                    <td>{{ $module['name_tr'] ?? '' }}</td>
                    <td>{{ $module['name_en'] ?? '' }}</td>
                    <td style="text-align: center;">{{ $module['hours'] ?? '' }}</td>
                    <td style="text-align: center; font-weight: bold; color: #b91c1c;">{{ $module['grade'] ?? '' }}</td>
                    <td style="text-align: center; font-weight: bold;">{{ $module['score'] ?? '' }}</td>
                </tr>
                @endforeach
            @else
                <tr>
                    <td colspan="6" style="text-align: center;">Ders modülü bulunamadı.</td>
                </tr>
            @endif
        </tbody>
    </table>

    @if(isset($transcriptData['competency_modules']) && is_array($transcriptData['competency_modules']) && count($transcriptData['competency_modules']) > 0)
    <div class="section-title">COMPETENCY COURSE MODULES</div>
    <table>
        <thead>
            <tr>
                <th>COURSE CODE</th>
                <th>COURSE NAME (Turkish)</th>
                <th>COURSE NAME (English)</th>
                <th>HOURS</th>
                <th>GRADE</th>
                <th>POINT</th>
            </tr>
        </thead>
        <tbody>
            @foreach($transcriptData['competency_modules'] as $module)
            <tr>
                <td style="text-align: center;">Y{{ $loop->iteration }}</td>
                <td>{{ $module['name_tr'] ?? '' }}</td>
                <td>{{ $module['name_en'] ?? '' }}</td>
                <td style="text-align: center;">{{ $module['hours'] ?? '' }}</td>
                <td style="text-align: center; font-weight: bold; color: #b91c1c;">{{ $module['grade'] ?? '' }}</td>
                <td style="text-align: center; font-weight: bold;">{{ $module['score'] ?? '' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif

    <div style="margin-top: 30px;">
        <div class="footer-left">
            <table class="totals-table">
                <tr>
                    <th colspan="2" style="text-align: center; background-color: #f8fafc;">Module Information</th>
                </tr>
                <tr>
                    <td>Course Module Total Hours</td>
                    <td>{{ $transcriptData['module_info']['course_total_hours'] ?? '-' }}</td>
                </tr>
                <tr>
                    <td>Course Module Total Grade</td>
                    <td style="color: #b91c1c;">{{ $transcriptData['module_info']['course_total_grade'] ?? '-' }}</td>
                </tr>
                <tr>
                    <td>Course Module Total Points</td>
                    <td>{{ $transcriptData['module_info']['course_total_score'] ?? '-' }}</td>
                </tr>
                
                @if(isset($transcriptData['module_info']['competency_total_hours']))
                <tr>
                    <td>Competency Module Total Hours</td>
                    <td>{{ $transcriptData['module_info']['competency_total_hours'] ?? '-' }}</td>
                </tr>
                <tr>
                    <td>Competency Module Total Grade</td>
                    <td style="color: #b91c1c;">{{ $transcriptData['module_info']['competency_total_grade'] ?? '-' }}</td>
                </tr>
                <tr>
                    <td>Competency Module Total Points</td>
                    <td>{{ $transcriptData['module_info']['competency_total_score'] ?? '-' }}</td>
                </tr>
                @endif
                
                <tr style="background-color: #f8fafc;">
                    <td>Grand Total Hours</td>
                    <td>{{ $transcriptData['module_info']['grand_total_hours'] ?? '-' }}</td>
                </tr>
                <tr style="background-color: #f8fafc;">
                    <td>Grand Total Grade</td>
                    <td style="color: #b91c1c;">{{ $transcriptData['module_info']['grand_total_grade'] ?? '-' }}</td>
                </tr>
                <tr style="background-color: #f8fafc;">
                    <td>Grand Total Points</td>
                    <td>{{ $transcriptData['module_info']['grand_total_score'] ?? '-' }}</td>
                </tr>
            </table>
        </div>
        
        <div class="footer-right">
            <div style="border: 1px solid #ccc; padding: 10px; margin-bottom: 20px;">
                <p style="margin: 0; font-size: 10px; color: #666;">Training Dates</p>
                <p style="margin: 5px 0 0 0; font-weight: bold;">
                    {{ $certificate->start_date ? \Carbon\Carbon::parse($certificate->start_date)->format('d.m.Y') : '' }} - 
                    {{ $certificate->end_date ? \Carbon\Carbon::parse($certificate->end_date)->format('d.m.Y') : '' }}
                </p>
            </div>
            
            <p>This certificate is awarded to</p>
            <h3 style="margin: 5px 0; font-size: 18px;">{{ $certificate->student->first_name }} {{ $certificate->student->last_name }}</h3>
            <p style="font-size: 10px; margin-bottom: 50px;">for successfully completing the training program.</p>
            
            <div class="signature-line">
                Director<br>
                Continuing Education Application and Research Center
            </div>
        </div>
        <div style="clear: both;"></div>
    </div>

</body>
</html>
