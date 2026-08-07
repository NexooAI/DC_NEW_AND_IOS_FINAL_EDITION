[Reflection.Assembly]::LoadWithPartialName("System.Drawing") | Out-Null

function Convert-ToPng ($filePath) {
    if (Test-Path $filePath) {
        # Load the image
        $img = [System.Drawing.Image]::FromFile($filePath)
        
        # Create a temporary path
        $tempPath = [System.IO.Path]::GetTempFileName()
        
        # Save as PNG
        $img.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png)
        $img.Dispose()
        
        # Copy back to overwrite original
        Copy-Item -Path $tempPath -Destination $filePath -Force
        Remove-Item -Path $tempPath -Force
        
        Write-Host "Successfully converted $filePath to a true PNG format."
    } else {
        Write-Host "File $filePath not found."
    }
}

Convert-ToPng "assets/images/logo_white.png"
Convert-ToPng "assets/images/logo_white_ta.png"
