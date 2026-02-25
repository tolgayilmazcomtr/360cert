<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Sertifika</title>
    <style>
        @foreach(collect($config['elements'])->pluck('font_family')->unique()->filter() as $font)
            @if($font != 'Arial' && $font != 'DejaVu Sans')
                @import url('https://fonts.googleapis.com/css?family={{ urlencode($font) }}:400,400i,700,700i&subset=latin,latin-ext&display=swap');
            @endif
        @endforeach

        @page {
            margin: 0px;
            padding: 0px;
        }
        body { 
            font-family: 'DejaVu Sans', sans-serif; 
            margin: 0px; 
            padding: 0px; 
            width: 100%; 
            height: 100%;
        }
        .page-container {
            position: relative;
            width: {{ $width }}px;
            height: {{ $height }}px;
            overflow: hidden;
            margin: 0;
            padding: 0;
        }
        .background-layer {
            position: absolute;
            top: 0;
            left: 0;
            width: {{ $width }}px;
            height: {{ $height }}px;
            z-index: -1;
            margin: 0;
            padding: 0;
        }
        .element {
            position: absolute;
            /* removed white-space: nowrap here to handle it dynamically */
        }
    </style>
</head>
<body>
    <div class="page-container">
        <img src="{{ $bgImage }}" class="background-layer" />
        @foreach($config['elements'] as $element)
        @php
            $content = '';
            $type = $element['type'] ?? '';
            
            // Check for dynamic language tags before switch
            $langCode = null;
            if (preg_match('/^training_name_(.+)$/', $type, $matches)) {
                $langCode = $matches[1];
                $type = 'training_name_dynamic'; // Rewrite type for switch
            } elseif (preg_match('/^certificate_type_(.+)$/', $type, $matches)) {
                $langCode = $matches[1];
                $type = 'certificate_type_dynamic';
            }

            switch($type) {
                case 'student_name':
                    $content = $certificate->student->first_name . ' ' . $certificate->student->last_name;
                    break;
                case 'certificate_no':
                    $content = $certificate->certificate_no;
                    break;
                case 'issue_date':
                    $content = \Carbon\Carbon::parse($certificate->issue_date)->format('d.m.Y');
                    break;
                case 'training_name':
                    $nameData = $certificate->training_program->name;
                    $certLang = $certificate->certificate_language ?? 'tr';
                    $trContent = is_array($nameData) ? ($nameData['tr'] ?? current($nameData) ?? '') : $nameData;
                    if ($certLang !== 'tr' && is_array($nameData) && !empty($nameData[$certLang])) {
                        $content = $trContent . " / " . $nameData[$certLang];
                    } else {
                        $content = $trContent;
                    }
                    break;
                case 'certificate_type':
                    if ($certificate->certificateType) {
                        $typeData = $certificate->certificateType->name;
                        $certLang = $certificate->certificate_language ?? 'tr';
                        $trContent = is_array($typeData) ? ($typeData['tr'] ?? current($typeData) ?? '') : $typeData;
                        if ($certLang !== 'tr' && is_array($typeData) && !empty($typeData[$certLang])) {
                            $content = $trContent . " / " . $typeData[$certLang];
                        } else {
                            $content = $trContent;
                        }
                    } else {
                        $content = '';
                    }
                    break;
                case 'training_name_dynamic':
                    // Yeni sistem: training_name_en, training_name_de vb.
                    $nameData = $certificate->training_program->name;
                    if (is_array($nameData)) {
                        $content = $nameData[$langCode] ?? $nameData['tr'] ?? current($nameData) ?? '';
                    } else {
                        $content = $nameData; // Yedek
                    }
                    break;
                case 'certificate_type_dynamic':
                    // Yeni sistem: certificate_type_tr, certificate_type_en vb.
                    if ($certificate->certificateType) {
                        $typeData = $certificate->certificateType->name;
                        if (is_array($typeData)) {
                            $content = $typeData[$langCode] ?? $typeData['tr'] ?? current($typeData) ?? '';
                        }
                    }
                    if (!$content) $content = '';
                    break;
                case 'start_date':
                    $content = $certificate->start_date ? \Carbon\Carbon::parse($certificate->start_date)->format('d.m.Y') : '';
                    break;
                case 'end_date':
                    $content = $certificate->end_date ? \Carbon\Carbon::parse($certificate->end_date)->format('d.m.Y') : '';
                    break;
                case 'duration_hours':
                    $content = $certificate->duration_hours ? $certificate->duration_hours . ' Saat' : '';
                    break;
                case 'birth_year':
                    $content = $certificate->student->birth_year ?? '';
                    break;
                case 'qr_code':
                    $w = $element['width'] ?? 100;
                    $h = $element['height'] ?? 100;
                    $content = '<img src="data:image/svg+xml;base64,'.$qrCode.'" style="width: '.$w.'px; height: '.$h.'px; display: block;">';
                    break;
                case 'dealer_logo':
                    $w = $element['width'] ?? 100;
                    $h = $element['height'] ?? 100;
                    if (isset($dealerLogo) && $dealerLogo) {
                        $content = '<img src="'.$dealerLogo.'" style="width: '.$w.'px; height: '.$h.'px; display: block; object-fit: contain;">';
                    } else {
                        $content = '';
                    }
                    break;
                default:
                    $trContent = $element['label'] ?? '';
                    $certLang = $certificate->certificate_language ?? 'tr';
                    $translatedContent = '';
                    
                    if ($certLang !== 'tr' && !empty($element['label_' . $certLang])) {
                        $translatedContent = $element['label_' . $certLang];
                    }

                    // Helper function to replace variables with corresponding translations
                    $replaceVars = function($text, $langToUse) use ($certificate) {
                        if (!str_contains($text, '{')) return nl2br(htmlspecialchars($text));
                        
                        $dealerName = '';
                        if (isset($certificate->student->user)) {
                            $dealerName = $certificate->student->user->company_name ?: $certificate->student->user->name;
                        }
                        $text = str_replace('{dealer_name}', '<strong>' . htmlspecialchars($dealerName) . '</strong>', $text);
                        
                        $studentName = isset($certificate->student) ? ($certificate->student->first_name . ' ' . $certificate->student->last_name) : '';
                        $text = str_replace('{student_name}', '<strong>' . htmlspecialchars($studentName) . '</strong>', $text);
                        
                        $duration = $certificate->duration_hours ?? '';
                        $text = str_replace('{duration_hours}', '<strong>' . htmlspecialchars($duration) . '</strong>', $text);
                        
                        if (isset($certificate->training_program)) {
                            $nameData = $certificate->training_program->name;
                            if (is_array($nameData)) {
                                foreach ($nameData as $l => $val) {
                                    $text = str_replace('{training_name_' . $l . '}', '<strong>' . htmlspecialchars($val) . '</strong>', $text);
                                }
                                $fallback = $nameData[$langToUse] ?? $nameData['tr'] ?? current($nameData) ?? '';
                                $text = str_replace('{training_name}', '<strong>' . htmlspecialchars($fallback) . '</strong>', $text);
                            } else {
                                $text = str_replace('{training_name}', '<strong>' . htmlspecialchars($nameData) . '</strong>', $text);
                            }
                        }
                        return nl2br($text);
                    };

                    $content = $replaceVars($trContent, 'tr');
                    if ($translatedContent) {
                        $content .= '<br><br>' . $replaceVars($translatedContent, $certLang);
                    }
                    
                    break;
            }
        @endphp

        @php
            $fontFamily = $element['font_family'] ?? 'DejaVu Sans';
            if ($fontFamily === 'Arial') {
                $fontFamily = 'DejaVu Sans'; // Force DejaVu Sans for Arial because DomPDF Helvetica lacks TR characters
            }
        @endphp
        <div class="element" style="
            left: {{ $element['x'] }}px; 
            top: {{ $element['y'] }}px; 
            font-size: {{ $element['font_size'] ?? 14 }}px; 
            color: {{ $element['color'] ?? '#000000' }};
            font-family: '{{ $fontFamily }}', 'DejaVu Sans', sans-serif;
            font-weight: {{ $element['font_weight'] ?? 'normal' }};
            font-style: {{ $element['font_style'] ?? 'normal' }};
            @if(isset($element['max_width']) && $element['max_width'])
                width: {{ $element['max_width'] }}px;
                white-space: normal;
                word-wrap: break-word;
            @else
                white-space: nowrap;
            @endif
            @if(isset($element['text_align']) && $element['text_align'])
                text-align: {{ $element['text_align'] }};
            @endif
        ">
            {!! $content !!}
        </div>
    @endforeach
    </div>
</body>
</html>
