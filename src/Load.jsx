import "./App.css"
export default function Load(){
    return <>
        <div id="loader" role="status" aria-live="polite">
            <div className="dumpling"><i className="eye l"></i><i className="eye r"></i><i className="mouth"></i></div>
            <div className="shadow"></div>
            <div>Лепим пельмени…</div>
            <div className="bar"><b></b></div>
        </div>
    </>
}