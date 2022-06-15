'create a sub in visual basic for applications to clear the value of a range of cells in a excel spreadsheet  with contains "(" or ")"

Sub clear_cell_value()
    dim i as integer
    dim j as integer
    Dim xlWorkBook As Excel.Workbook
    Dim xlWorkSheet As Excel.Worksheet
    Dim xlRange As Excel.Range
    dim value as string
    xlWorkBook = xlApp.ActiveWorkbook
    xlWorkSheet = xlWorkBook.Worksheets("Sheet1")
    for i=1 to 100
        for j=1 to 100
            xlRange = xlWorkSheet.Range("A" & i & ":A" & j)
            value = xlRange.Value
            if value like "%(%" or value like "%%)%" then
            'get the value at left of "("
            value = value.substring(0,value.indexof("("))
                xlRange.Value = value
            end if
        next
 end Sub   



