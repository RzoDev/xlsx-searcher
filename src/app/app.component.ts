import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Workbook } from 'exceljs';

export interface ITabs{
  name: string;
  cols: number;
  size: number;
  headers: string[];
  data: any[];
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterOutlet
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'xlsx-searcher';
  
  private dateToken = '**TOKDT**';

  tabs: ITabs[] = [];
  elements: any[] = [];
  searchs: any[] = [];

  file: any;


  tab = new FormControl(null)
  search = new FormControl('')
  useFirstRowAsHeader = new FormControl(true)
  convertDates = new FormControl(true)

  ngOnInit(){
    this.tab.valueChanges.subscribe((v:any)=>{
      if(v==null) return;
      //console.log('select tab',v)
      this.setData(v);
    })
    this.search.valueChanges.subscribe((v:any)=>{
      if(v.length>1){
        v = v.toLocaleLowerCase();
        this.searchs = this.elements.filter((e:string[])=>e.join('|').toLocaleLowerCase().indexOf(v)!==-1);
      }else{
        this.searchs = this.elements;
      }
    })
    this.useFirstRowAsHeader.valueChanges.subscribe((v:any)=>{
      if(this.tabs.length>0){
        this.loadDataFile(this.file.source);
      }
    })
    this.convertDates.valueChanges.subscribe((v:any)=>{
      if(this.tabs.length>0){
        this.loadDataFile(this.file.source);
      }
    })
  }

  setData(v: ITabs|any){
    this.elements = v.data;
    this.searchs = v.data;
    this.search.reset('');
  }

  loadFile(target:any){
    let file = target.files[0];
    this.getSource(file);
  }

  private loadDataFile(source:ArrayBuffer|any){
    
    this.tabs = [];

    const workbook = new Workbook();
    //await workbook.xlsx.read(source);

    workbook.xlsx.load(source).then((wb: any) => {
      //console.log(wb, 'workbook instance')
      wb.eachSheet((sheet: any, id: number) => {
        //console.log(sheet, id)
        let book: any = {
          name: sheet._name,
          cols: sheet._rows[0]._cells.length,//sheet._columns.length,
          size: sheet._rows.length,
          headers: [],
          data: []
        }
        if(this.useFirstRowAsHeader.value){
          book.headers = sheet._rows[0]._cells
          .map((el:any)=>el._value.model.value) as [];
          /* book.headers = book.headers.filter(function (el: any) {
            return el != null;
          }); */
        }
        sheet.eachRow((row: any, rowIndex: number) => {
          //console.log(row.values, rowIndex)
          let myrow: any[] = row.values;
          myrow = myrow.splice(1);
          /* myrow = myrow.filter(function (el) {
            return el !== null;
          }); */
          myrow = myrow.map((val:any)=>{
            if(val instanceof Date){
              if(this.convertDates.value){
                val = this.convertDate(val);
                val = val+this.dateToken
              }
            }
            return val;
          });
          if(this.useFirstRowAsHeader.value){
            if(rowIndex>1){
              book.data.push(myrow)
            }
          }else{
            book.data.push(myrow)
          }
        })

        this.tabs.push(book)
      })
      //console.log('tabs',this.tabs)
    })

    this.tab.reset();
  }

  private async addFile(file: any, source: ArrayBuffer|any){
    this.file = {
      filename: file.name,
      name: file.name.split('.')[0],
      ext: file.name.split('.')[1],
      size: file.size,
      mime: file.type,
      source: source
    }

    this.loadDataFile(source);
  }
  private getSource(file:any){
    let reader = new FileReader();
    let target = null;
    let self = this;

    reader.onload = function(e) {
				target =  e.target || e.srcElement;
        self.addFile(file,reader.result);
    };
    //reader.readAsDataURL(file);
    reader.readAsArrayBuffer(file);
  }

  getTab(): any{
    return this.tab.value;
  }

  getData(): any[]{
    return this.searchs;
  }

  gVal(val: any){
    if(val==undefined) return val;
    
    let hasDateToken: boolean = false;

    if(typeof val != 'string'){
      val = (val+'');
    }

    //console.log('val received',val)
    if(val.indexOf(this.dateToken)!==-1){
      val = val.replace(this.dateToken,'');
      hasDateToken = true;
    }
    //console.log('val tranform',val,hasDateToken)
    
    let srch = this.search.value;
    if(srch=='') return val;

    srch = (srch+'');
    let re = new RegExp('('+srch+')','ig')


    if(val.match(re)!==null){
      val = val.replace(re,'<b class="green">$1</b>')
      if(hasDateToken){
        val = `<span class="obs" title="Fecha convertida">${val}<span>`
      }
      return val;
    }
    return val;
  }

  private convertDate(date: Date): string{
    let md = date.toISOString().substring(0,10).split('-');
    //return `<span class="obs" title="Fecha convertida: ${date.toString()}">${md[2]}/${md[1]}/${md[0]}<span>`
    return `${md[2]}/${md[1]}/${md[0]}`
  }
}
