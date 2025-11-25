// dummy -> throwing "not implemented"
// stub -> returns a hard coded value
// spy -> stub that you can ask if it got called
// mock -> spy that has self-verification
// fake -> an implementation of the collaborator without key hard-to-test factors

// The kinds of things in a software:
//   domain logic -> runs the actual business, is the thing that is unique to you
//   adapters -> bridge between the domain and the real world

interface UserAddress {

  name: string,
  address: string
}

interface SQL{
  query: (a:string): UserAddress
}

interface Event (
  id: string
  type: string
)

type Dispatch: (e:Event)=>null


interface GetUserOptions {
  include_address: boolean
}


const  getUser = ({include_address}:include_address, dispatch:Dispatch, sql:SQL
): UserAdress =>{
    const user_address = sql.query("select user.name, address.address from user join address on user.id = address.person_id ")
    dispatch({type: "user_queried", id: user_address.name})
    return {name: title_case(user_address.name), address: title_case(user_adress.address)}
  }}}

// set up real database
describe("get user", ()=>{
  describe("when user is found", ()=>{
    describe("when address is found", ()=>{
      //test....
    })
    describe("when address is not found", ()=>{
      //test....
    })
  })
  describe("when the user is not found",()=>{
    //test ...
  })
})
// tear down real database


(
  (
    (! * &)
    b
    c
    d)
  (1 2 3)
  (x y)
)


describe("how to use test doubles in wishful thining", ()=>{
  test("wishful thinking a stub - db returns user with address", ()=>{
    const queryStub = {query: (a:string)=> ({name: "tom", address: "tom's house"})}
    const dispatch = mock(({type, id}) =>())

    const user:UserAddress = getUser({include_address: true},dispatch,queryStub)
    expect(user.name).toBe("Tom")
    expect(user.address).toBe("Tom's House")
    expect(dispatch).toHaveBeenCalledWith({type: "user_queried", id: "tom"})
  })
})
