Dim objShell, objIE, objShellWindows, iCount, Running, wshShell, oExec, key

Set WshShell = CreateObject("WScript.Shell")
Set oExec = WshShell.Exec("netstat -o -n -a")
key = "0.1:8888"

Running = False

Dim values
values = checkPortStatus(oExec, key)
portInUse = values(0)
input = values(1)

If portInUse Then
	x = InStrRev(input, "")
	ProcessID = Mid(input, x+1)
	commandText = "tasklist /FI " & Chr(34) & "PID eq " & ProcessID & Chr(34)

Dim oExec2, key2
Set oExec2 = WshShell.Exec(commandTxt)
key2 = ProcessID

Dim values2
values2 = checkPortStatus(oExec2, key2)
Found = values2(0)
input2 = values2(1)

If Found Then
    y = InStr(input2, " ")
    ExeName = Left(input2, y-1)
        WScript.StdOut.WriteLine "Port 8888 is using by " & ExeName
    Running = True
End If
Else
    MsgBox "Port 8888 is not in use"
End If

If Running = False Then
	Call CreateObject("WScript.Shell").Run("cmd.exe /K Node app.js", 8, false)
	Call CreateObject("Shell.Application").ShellExecute("C:\Program Files (x86)\Google\Chrome\Application\chrome.exe", "http://localhost:8888", "", "", 1)
End If


Function checkPortStatus(oExec, key)
portInUse = false
input = ""
Do While True

     If Not oExec.StdOut.AtEndOfStream Then
          input = oExec.StdOut.ReadLine()
          If InStr(input, key) <> 0 Then 
        ' Found Port 80
                portInUse = true
                Exit DO
          End If
     Else
        Exit DO
     End If
     WScript.Sleep 100
Loop

Do While oExec.Status <> 1
 WScript.Sleep 100
Loop
Dim values(1)
values(0) = portInUse
values(1) = input

checkPortStatus = values

End Function